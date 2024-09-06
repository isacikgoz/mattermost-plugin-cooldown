import React from 'react';
import Countdown from 'react-countdown';
import { zeroPad, CountdownRenderProps } from 'react-countdown';

type Props = {
    channelId: string;
    cooldownForUser: {enabled: boolean, frequency_seconds?: number, last_post_at?: number};
    fetchCooldownForUser: any;
}

type State = {
    enabled: boolean;
    frequency_seconds: number;
    last_post_at: number;
}
  
class CooldownTimerLabel extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            enabled: false,
            last_post_at: 0,
            frequency_seconds: 0,
        };
    }

    componentDidMount(): void {
        this.props.fetchCooldownForUser(this.props.channelId);

        if (this.props.cooldownForUser) {
            this.setState({
                enabled: this.props.cooldownForUser.enabled,
                last_post_at: this.props.cooldownForUser.last_post_at || 0,
                frequency_seconds: this.props.cooldownForUser.frequency_seconds || 0,
            });
        };
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.channelId && this.props.channelId !== prevProps.channelId) {
            this.props.fetchCooldownForUser(this.props.channelId);
        }

        if (this.props.cooldownForUser && this.props.cooldownForUser !== prevProps.cooldownForUser) {
            this.setState({
                enabled: this.props.cooldownForUser.enabled,
                last_post_at: this.props.cooldownForUser.last_post_at || 0,
                frequency_seconds: this.props.cooldownForUser.frequency_seconds || 0,
        });
    }
    }

    calculateFrequencySeconds = () => {
        const now = Date.now();
        const last = now - this.state.last_post_at;
        if (last > this.state.frequency_seconds*1000 || this.state.last_post_at === 0) {
            return 0;
        } else {
            return now + (this.state.frequency_seconds*1000 - last);
        }
    }

    render() {
        const Completionist = () => <label style={styles.label}>{ 'Cooldown mode enabled.' } </label>;
        const isEnabled = this.state.enabled;
        
        const renderer = ({hours, minutes, seconds, completed} : CountdownRenderProps) => {
            if (completed) {
                return <Completionist />;
            } else {
                // Render a countdown
                return <span>
                    {zeroPad(hours, 2)}:{zeroPad(minutes, 2)}:{zeroPad(seconds, 2)}
                </span>;
            }
        };
        
        return (
            <div>
                {isEnabled ?
                <Countdown
                    date={this.calculateFrequencySeconds()}
                    renderer={renderer}
                >
                <Completionist />
                </Countdown>
                : null}
            </div>
        );
    }
}

const styles = {
    label: {
        display: 'unset',
    },
  };

export default CooldownTimerLabel;