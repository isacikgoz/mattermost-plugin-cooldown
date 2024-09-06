import React from 'react';
import PropTypes from 'prop-types';

import { Modal } from 'react-bootstrap';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import './cooldown_settings.scss';

type Props = {
  show: boolean;
  channelId: string;
  close: () => void;
  cooldownSettings?: {enabled?: boolean, frequency_seconds?: number};
  saveFn: any;
  fetchCooldownSettings: any;
}

type State = {
  show: boolean;
  enabled: boolean;
  frequency_seconds: number;
  sliderValue: number;
};

const marks = {
  0: '1 Min',
  10: <strong>5 Mins</strong>,
  30: '30 Mins',
  45: '1 Hour',
  60: '6 Hours',
  100: <strong>1 Day</strong>,
};

export default class CooldownSettingsModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      show: false,
      enabled: false,
      frequency_seconds: 300,
      sliderValue: 10,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.channelId && this.props.channelId !== prevProps.channelId) {
        this.props.fetchCooldownSettings(this.props.channelId);
    }

    if (this.props.cooldownSettings && this.props.cooldownSettings !== prevProps.cooldownSettings) {
        this.setState({
            enabled: this.props.cooldownSettings.enabled || false,
            frequency_seconds: this.props.cooldownSettings.frequency_seconds || 300,
            sliderValue: this.frequencyToSliderValue(this.props.cooldownSettings.frequency_seconds || 300),
        });
    }
  }
  
  enableCooldownMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({enabled: e.target.checked});
  }

    
  disableCooldownMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({enabled: !e.target.checked});
  }

  onSave = () => {
    this.props.saveFn(this.props.channelId, this.state.enabled, this.state.frequency_seconds).then(() => {
      console.log('saved');
    }).catch((e: any) => {
      console.log(e);
  });
    this.props.close();
  }

  onSliderChange = (value: number | number[]) => {
    let seconds = 0;
    switch (value) {
      case 0:
        seconds = 60;
        break;
      case 10:
        seconds = 300;
        break;
      case 30:
        seconds = 1800;
        break;
      case 45:
        seconds = 3600;
        break;
      case 60:
        seconds = 21600;
        break;
      case 100:
        seconds = 86400;
        break;
      default:
        seconds = 300;
    }

    this.setState({
      frequency_seconds: seconds,
      sliderValue: value as number,
    });
  }

  frequencyToSliderValue = (value: number) =>  {
    switch (value) {
      case 60:
        return 0;
      case 300:
        return 10;
      case 1800:
        return 30;
      case 3600:
        return 45;
      case 21600:
        return 60;
      case 86400:
        return 100;
      default:
        return 0;
    }
  }


  render() {
    return (
        <Modal
          dialogClassName='a11y__modal cooldown-modal-settings'
          onHide={this.props.close}
          show={this.props.show ?? this.state.show}
          role='dialog'
          aria-labelledby='cooldownSettingsModalLabel'
        >
        <Modal.Header closeButton={true}>
          <Modal.Title
            componentClass="h1"
            id="cooldownSettingsModalLabel"
          >
            {"Channel Cooldown Settings"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div
            className='col-sm-cooldown-1'
         >
          <label className='control-label'>{"Enable Cooldown mode: "}</label>
          <label>
              <input
                type='radio'
                onChange={this.enableCooldownMode}
                checked={this.state.enabled}
                style={styles.radio}
                />
                {"On"}
          </label>
          <label>
              <input
                type='radio'
                onChange={this.disableCooldownMode}
                checked={!this.state.enabled}
                style={styles.radio}
                />
                {"Off"}
          </label>
         </div >
          <div  className= 'col-sm-cooldown-1' >
            <label className="control-label">{"Cooldown Duration:"}</label>
            <Slider 
            marks={marks}
            step={null}
            disabled={!this.state.enabled}
            value={this.state.sliderValue}
            onChange={this.onSliderChange}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-link"
            onClick={this.props.close}
          >
            {"Cancel"}
          </button>
          <button
            id="save-button"
            className="btn btn-primary save-button"
            onClick={this.onSave}
          >
            {"Save"}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const styles = {
  radio: {
      marginLeft: '12px',
      marginRight: '8px',
  },
};