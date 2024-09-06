package main

import (
	"context"
	"fmt"

	root "github.com/isacikgoz/mattermost-plugin-cooldown"

	"github.com/mattermost/mattermost/server/public/pluginapi/cluster"
)

const (
	JobLockKey = PluginName + "_job_lock"
)

// here it is required to acquire an exclusive lock to avoid
// race in an HA environment
func (p *Plugin) lockKVMutex(ctx context.Context) (func(), error) {
	lock, err := cluster.NewMutex(p.API, root.Manifest.Id+JobLockKey)
	if err != nil {
		return nil, fmt.Errorf("could not acquire lock: %w", err)
	}

	if err = lock.LockWithContext(ctx); err != nil {
		return nil, fmt.Errorf("could not lock the lock: %w", err)
	}

	return lock.Unlock, nil
}
