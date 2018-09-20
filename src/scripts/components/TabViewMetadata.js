import React from 'react';
import TooltipButton from './TooltipButton';
import './TabViewMetadata.scss';

export default class TabViewMetadata extends React.Component {
  constructor(props) {
    super(props);

    this.titleListenerName = 'input.metadata-content-sync';
  }

  componentDidMount() {
    if (this.props.$metadataForm !== undefined) {

      this.$topbarTitleField = this.props.$mainTitleField
        .find('input')
        .first();

      H5PEditor.$(document)
        .find('.topbar input')
        .first();

      // Sync metadata title field and top bar field
      H5PEditor.sync(
        this.$metadataTitleField,
        this.$topbarTitleField,
        {
          listenerName: this.titleListenerName
        }
      );
      this.props.$metadataForm.appendTo(this.form);
    }
  }

  componentWillUnmount() {
    // Unsync title fields
    if (this.$metadataTitleField) {
      this.$metadataTitleField.off(this.titleListenerName);
    }
    if (this.$topbarTitleField) {
      this.$topbarTitleField.off(this.titleListenerName);
    }
  }

  render() {
    return (
      <div id="metadata" className="tab tab-view-full-page large-padding" >
        <span className="tab-view-title">Metadata</span>
        <span className="tab-view-description">Add metadata for main content</span>
        <div className="tab-view-white-box" >
          <form>
            <fieldset>
              <legend className="tab-view-info">
                Metadata
                <TooltipButton
                  text="Metadata help users to reuse your content."
                  tooltipClass={ 'tooltip below' }
                />
              </legend>
              <div ref={ element => this.form = element } />
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}
