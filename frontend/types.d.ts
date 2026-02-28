declare module 'cytoscape-fcose';
declare module 'cytoscape-edgehandles';
declare module 'graphology-layout-forceatlas2';

declare namespace cytoscape {
  interface EdgehandlesOptions {
    [key: string]: unknown;
  }

  interface Core {
    edgehandles(options?: EdgehandlesOptions): unknown;
  }
}
