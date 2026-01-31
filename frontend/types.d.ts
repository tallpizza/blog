declare module 'cytoscape-fcose';
declare module 'cytoscape-edgehandles';
declare module 'graphology-layout-forceatlas2';

declare namespace cytoscape {
  interface Core {
    edgehandles(options?: any): any;
  }
}
