package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
	"github.com/mattermost/mattermost/server/public/pluginapi"
	"github.com/mattermost/squirrel"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	client *pluginapi.Client

	db *sqlx.DB

	handler *handler

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	cache map[string]*CooldownConfig
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.handler.ServeHTTP(w, r)
}

func (p *Plugin) OnActivate() error {
	p.client = pluginapi.NewClient(p.API, p.Driver)
	p.cache = make(map[string]*CooldownConfig)

	idb, err := p.client.Store.GetMasterDB()
	if err != nil {
		return err
	}
	p.db = sqlx.NewDb(idb, p.client.Store.DriverName())

	unlock, err := p.lockKVMutex(context.Background())
	if err != nil {
		return err
	}
	defer unlock()

	keys, appErr := p.API.KVList(0, 10000)
	if appErr != nil {
		return appErr
	}

	p.API.LogInfo("keys", "keys", keys)
	for _, k := range keys {
		// there can be mutex lock keys in the store
		if !model.IsValidId(k) {
			continue
		}

		b, appErr := p.API.KVGet(k)
		if appErr != nil {
			return appErr
		}

		var opts CooldownConfig
		err := json.Unmarshal(b, &opts)
		if err != nil {
			p.API.LogError("error while unmarshalling", "err", err)
			continue
		}

		p.cache[k] = &opts
	}

	p.handler = newHandler(p)

	return nil
}

func (p *Plugin) OnDeactivate() error {
	if p.db != nil {
		p.db.Close()
	}
	return nil
}

// See https://developers.mattermost.com/extend/plugins/server/reference/
func (p *Plugin) MessageWillBePosted(c *plugin.Context, post *model.Post) (*model.Post, string) {
	opts, ok := p.cache[post.ChannelId]
	if !ok {
		p.API.LogInfo("Channel not found in cache", "channel_id", post.ChannelId)
		return post, ""
	}

	if !opts.Enabled {
		return post, ""
	}

	var phf squirrel.PlaceholderFormat
	phf = squirrel.Question
	if p.db.DriverName() == model.DatabaseDriverPostgres {
		phf = squirrel.Dollar
	}
	builder := squirrel.StatementBuilder.PlaceholderFormat(phf)
	interval := time.Now().Add(-time.Second * time.Duration(opts.FrequencySeconds)).UnixMilli()

	query := builder.Select("count(*)").From("Posts").
		Where(squirrel.Gt{"CreateAt": interval}).Where(squirrel.Eq{"ChannelId": post.ChannelId}).
		Where(squirrel.Eq{"UserId": post.UserId})

	queryString, args, err := query.ToSql()
	if err != nil {
		return nil, fmt.Sprintf("error: posts_tosql: %s", err)
	}

	p.API.LogInfo("query", "query", queryString, "args", args)
	var res int
	err = p.db.QueryRow(queryString, args...).Scan(&res)
	if err != nil {
		return nil, err.Error()
	}

	if res > 0 {
		return nil, "You are posting too frequently"
	}

	return post, ""
}
