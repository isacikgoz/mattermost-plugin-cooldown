import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";

import { GlobalState } from "@mattermost/types/lib/store";

import { getCooldownForUser } from "../../selectors";
import { fetchCooldownForUser } from "../../actions";

import CooldownTimerLabel from "./cooldown_timer";

function mapStateToProps(state: GlobalState) {
  return {
    channelId: state.entities.channels.currentChannelId,
    cooldownForUser: getCooldownForUser(state).cooldownForUser || {enabled: false, frequency_seconds: 0, last_post_at: 0},
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({
  fetchCooldownForUser,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(CooldownTimerLabel);
