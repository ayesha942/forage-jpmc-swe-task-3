import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator, Row } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[];
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}

class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    const elem = document.getElementsByTagName('perspective-viewer')[0] as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float',
    };

    if (window.perspective && window.perspective.worker) {
      this.table = window.perspective.worker().table(schema);
    }

    if (this.table) {
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('columns', '["ratio","lower_bound","upper_bound","trigger_alert"]');
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        lower_bound: 'avg',
        upper_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      const newData: Row = DataManipulator.generateRow(this.props.data);

      // Convert to the format expected by Perspective: Array of objects with arrays as values
      const formattedData: Array<Record<string, (string | number | boolean | Date)[]>> = [
        {
          price_abc: [newData.price_abc],
          price_def: [newData.price_def],
          ratio: [newData.ratio],
          timestamp: [newData.timestamp],
          upper_bound: [newData.upper_bound],
          lower_bound: [newData.lower_bound],
          trigger_alert: [newData.trigger_alert !== undefined ? newData.trigger_alert : 0] // Use 0 as a fallback for null
        }
      ];

      // Update the table with new data
      this.table.update(formattedData);
    }
  }
}

export default Graph;
