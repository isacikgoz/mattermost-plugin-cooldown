package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/squirrel"
)

func (p *Plugin) SetCooldown(ctx context.Context, channelID string, options CooldownConfig) error {
	unlock, err := p.lockKVMutex(ctx)
	if err != nil {
		return err
	}
	defer unlock()

	b, err := json.Marshal(options)
	if err != nil {
		return fmt.Errorf("could not marshal options: %w", err)
	}

	p.API.LogInfo("going to set cooldown", "channel_id", channelID, "options", string(b))
	if !options.Enabled {
		appErr := p.API.KVDelete(channelID)
		if appErr != nil {
			return appErr
		}
		delete(p.cache, channelID)

		return nil
	}

	appErr := p.API.KVSet(channelID, b)
	if appErr != nil {
		return appErr
	}
	p.cache[channelID] = &options

	return nil
}

func (p *Plugin) GetCooldown(ctx context.Context, channelID string) (CooldownConfig, error) {
	unlock, err := p.lockKVMutex(ctx)
	if err != nil {
		return CooldownConfig{}, err
	}
	defer unlock()

	cfg, ok := p.cache[channelID]
	if !ok {
		return CooldownConfig{}, nil
	}

	// we always read from the cache
	return *cfg, nil
}

func (p *Plugin) GetCooldownForUser(ctx context.Context, channelID, userID string) (CooldownForUser, error) {
	unlock, err := p.lockKVMutex(ctx)
	if err != nil {
		return CooldownForUser{}, err
	}
	defer unlock()

	cfg, ok := p.cache[channelID]
	if !ok {
		return CooldownForUser{}, nil
	}

	// TODO: implement chaching for last post at
	var phf squirrel.PlaceholderFormat
	phf = squirrel.Question
	if p.db.DriverName() == model.DatabaseDriverPostgres {
		phf = squirrel.Dollar
	}
	builder := squirrel.StatementBuilder.PlaceholderFormat(phf)

	query := builder.Select("CreateAt").From("Posts").
		Where(squirrel.Eq{"ChannelId": channelID}).
		Where(squirrel.Eq{"UserId": userID}).
		OrderBy("CreateAt DESC").Limit(1)

	queryString, args, err := query.ToSql()
	if err != nil {
		return CooldownForUser{}, fmt.Errorf("error at posts_tosql: %w", err)
	}

	var res int64
	err = p.db.QueryRow(queryString, args...).Scan(&res)
	if err != nil && err == sql.ErrNoRows {
		return CooldownForUser{
			CooldownConfig: *cfg,
			LastPostAt:     0,
		}, nil
	} else if err != nil {
		return CooldownForUser{}, err
	}

	// we always read from the cache
	return CooldownForUser{
		CooldownConfig: *cfg,
		LastPostAt:     res,
	}, nil
}
