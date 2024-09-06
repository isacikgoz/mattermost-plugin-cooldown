import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";

import { GlobalState } from "@mattermost/types/lib/store";

import { getCooldownSettingsModalState, getCooldownConfiguration } from "../../selectors";
import { closeCooldownSettingsModal, setCooldown, fetchCooldownSettings } from "../../actions";

import CooldownSettingsModal from "./cooldown_settings";

function mapStateToProps(state: GlobalState) {
  return {
    show: getCooldownSettingsModalState(state).show,
    channelId: getCooldownSettingsModalState(state).channelId,
    cooldownSettings: getCooldownConfiguration(state).cooldownSettings,
    saveFn: setCooldown,
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({
  close: closeCooldownSettingsModal,
  fetchCooldownSettings,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CooldownSettingsModal);
