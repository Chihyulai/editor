import React from 'react'

import JSONEditor from './JSONEditor'
import SourceEditor from './SourceEditor'
import FilterEditor from '../filter/FilterEditor'
import PropertyGroup from '../fields/PropertyGroup'
import LayerEditorGroup from './LayerEditorGroup'
import LayerSettings from './LayerSettings'

import InputBlock from '../inputs/InputBlock'
import MultiButtonInput from '../inputs/MultiButtonInput'

import layout from '../../config/layout.json'
import { margins, fontSizes } from '../../config/scales'
import colors from '../../config/colors'

class UnsupportedLayer extends React.Component {
  render() {
    return <div></div>
  }
}

/** Layer editor supporting multiple types of layers. */
export default class LayerEditor extends React.Component {
  static propTypes = {
    layer: React.PropTypes.object.isRequired,
    sources: React.PropTypes.object,
    vectorLayers: React.PropTypes.object,
    onLayerChanged: React.PropTypes.func,
    onLayerIdChange: React.PropTypes.func,
  }

  static defaultProps = {
    onLayerChanged: () => {},
    onLayerIdChange: () => {},
    onLayerDestroyed: () => {},
  }

  static childContextTypes = {
    reactIconBase: React.PropTypes.object
  }

  constructor(props) {
    super(props)

    //TODO: Clean this up and refactor into function
    const editorGroups = {}
    layout[this.props.layer.type].groups.forEach(group => {
      editorGroups[group.title] = true
    })

    this.state = { editorGroups }
  }

  componentWillReceiveProps(nextProps) {
    const additionalGroups = { ...this.state.editorGroups }

    layout[nextProps.layer.type].groups.forEach(group => {
      if(!(group.title in additionalGroups)) {
        additionalGroups[group.title] = true
      }
    })

    this.setState({
      editorGroups: additionalGroups
    })
  }

  getChildContext () {
    return {
      reactIconBase: {
        size: fontSizes[4],
        color: colors.lowgray,
      }
    }
  }

  /** A {@property} in either the paint our layout {@group} has changed
   * to a {@newValue}.
   */
  onPropertyChange(group, property, newValue) {
    if(group) {
      this.props.onLayerChanged({
        ...this.props.layer,
        [group]: {
          ...this.props.layer[group],
          [property]: newValue
        }
      })
    } else {
      this.props.onLayerChanged({
        ...this.props.layer,
        [property]: newValue
      })
    }
  }

  onFilterChange(newValue) {
    const changedLayer = {
      ...this.props.layer,
      filter: newValue
    }
    this.props.onLayerChanged(changedLayer)
  }

  onGroupToggle(groupTitle, active) {
    const changedActiveGroups = {
      ...this.state.editorGroups,
      [groupTitle]: active,
    }
    this.setState({
      editorGroups: changedActiveGroups
    })
  }

  renderGroupType(type, fields) {
    switch(type) {
      case 'settings': return <LayerSettings
        id={this.props.layer.id}
        type={this.props.layer.type}
        onTypeChange={v => this.onPropertyChange(null, 'type', v)}
        onIdChange={newId => this.props.onLayerIdChange(this.props.layer.id, newId)}
      />
      case 'source': return <div>
        {this.props.layer.filter &&
        <FilterEditor
          filter={this.props.layer.filter}
          properties={this.props.vectorLayers[this.props.layer['source-layer']]}
          onChange={f => this.onFilterChange(f)}
        />
        }
        <SourceEditor
          source={this.props.layer.source}
          sourceLayer={this.props.layer['source-layer']}
          sources={this.props.sources}
          onSourceChange={console.log}
          onSourceLayerChange={console.log}
        />
        <InputBlock label={"Inspection Mode"}>
          <MultiButtonInput
            value={"highlight"}
            options={[["highlight", "Highlight"], ["normal", "Normal"]]}
          />
        </InputBlock>
      </div>
      case 'properties': return <PropertyGroup
        layer={this.props.layer}
        groupFields={fields}
        onChange={this.onPropertyChange.bind(this)}
      />
      case 'jsoneditor': return <JSONEditor
        layer={this.props.layer}
        onChange={this.props.onLayerChanged}
      />
      default: return null
    }
  }

  render() {
    const layerType = this.props.layer.type
    const layoutGroups = layout[layerType].groups.filter(group => {
      return !(this.props.layer.type === 'background' && group.type === 'source')
    }).map(group => {
      return <LayerEditorGroup
        key={group.title}
        title={group.title}
        isActive={this.state.editorGroups[group.title]}
        onActiveToggle={this.onGroupToggle.bind(this, group.title)}
      >
        {this.renderGroupType(group.type, group.fields)}
      </LayerEditorGroup>
    })

    return <div>
      {layoutGroups}
    </div>
  }
}
