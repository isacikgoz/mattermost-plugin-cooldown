package main

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
)

type handler struct {
	plugin *Plugin
	router *mux.Router
}

// newHandler constructs a new handler.
func newHandler(plugin *Plugin) *handler {
	handler := &handler{
		plugin: plugin,
	}

	root := mux.NewRouter()
	root.Use(handler.authorized)

	cds := root.PathPrefix("/cooldowns").Subrouter()
	cds.HandleFunc("/{channel_id:[A-Za-z0-9]+}", handler.setCooldownHandler).Methods(http.MethodPost)
	cds.HandleFunc("/{channel_id:[A-Za-z0-9]+}", handler.getCooldownHandler).Methods(http.MethodGet)
	cds.HandleFunc("/{channel_id:[A-Za-z0-9]+}/mine", handler.getCooldownForUserHandler).Methods(http.MethodGet)

	handler.router = root

	return handler
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.plugin.API.LogInfo("serving http")
	h.router.ServeHTTP(w, r)
}

func (h *handler) authorized(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("Mattermost-User-Id")
		if userID == "" {
			http.Error(w, "Not authorized", http.StatusUnauthorized)
			return
		}

		channelID := mux.Vars(r)["channel_id"]
		if channelID == "" {
			http.Error(w, "Missing channel id", http.StatusBadRequest)
			return
		}

		ch, appErr := h.plugin.API.GetChannel(channelID)
		if appErr != nil {
			h.plugin.API.LogError("error while getting the channel", "err", appErr)
			w.WriteHeader(appErr.StatusCode)
			return
		}

		if r.Method == http.MethodGet {
			if !h.plugin.API.HasPermissionToChannel(userID, ch.Id, model.PermissionReadChannel) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
			return
		}

		switch ch.Type {
		case model.ChannelTypeOpen:
			if !h.plugin.API.HasPermissionToChannel(userID, ch.Id, model.PermissionManagePublicChannelProperties) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		case model.ChannelTypePrivate:
			if !h.plugin.API.HasPermissionToChannel(userID, ch.Id, model.PermissionManagePrivateChannelProperties) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		default:
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *handler) setCooldownHandler(w http.ResponseWriter, r *http.Request) {
	var cfg CooldownConfig
	err := json.NewDecoder(r.Body).Decode(&cfg)
	if err != nil {
		h.plugin.API.LogError("error while processing the request", "err", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	channelID := mux.Vars(r)["channel_id"]
	err = h.plugin.SetCooldown(r.Context(), channelID, cfg)
	if err != nil {
		h.plugin.API.LogError("error while setting the cooldown", "err", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (h *handler) getCooldownHandler(w http.ResponseWriter, r *http.Request) {
	channelID := mux.Vars(r)["channel_id"]
	cfg, err := h.plugin.GetCooldown(r.Context(), channelID)
	if err != nil {
		h.plugin.API.LogError("error while setting the cooldown", "err", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(cfg)
	if err != nil {
		h.plugin.API.LogError("error while marshaling configuration", "err", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (h *handler) getCooldownForUserHandler(w http.ResponseWriter, r *http.Request) {
	channelID := mux.Vars(r)["channel_id"]
	userID := r.Header.Get("Mattermost-User-Id")
	cfg, err := h.plugin.GetCooldownForUser(r.Context(), channelID, userID)
	if err != nil {
		h.plugin.API.LogError("error while getting the cooldown for user", "err", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(cfg)
	if err != nil {
		h.plugin.API.LogError("error while marshaling configuration", "err", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
