[中文](README.md) | **English**
    
# Introduction
  This project contains all the source code for the [VJMap](https://vjmap.com/en/) official website: https://vjmap.com/en/ demo examples.

  [Online demo:](https://vjmap.com/demo/#/gallery/map?lang=en) https://vjmap.com/demo/#/gallery/map?lang=en

# Running
  
  The entry file is `index.html`, and the example directory is `src`. Each example is independent and can run standalone.

  Due to `File protocol` CORS restrictions, double-clicking `index.html` directly may cause some resources to fail to load. You need to run it via an `HTTP server`:
  
- Method 1 (requires `Node.js`):
```
npm install -g live-server
```
Then navigate to the current directory in the command line and type `live-server`.

- Method 2 (VSCode)

Install the `Live Server` plugin in `VSCode`. After installation, open this directory, select an HTML page, right-click and choose `Open With Live Server`.


# About VJMap

`VJMap` provides a one-stop solution for `CAD` drawings or `custom map format` `WebGIS` `visualization` display development. It supports common formats such as `AutoCAD` `DWG` format files, `GeoJSON` and other common `GIS` file formats. It uses WebGL `vector tiles` and `custom styles` to render interactive maps, providing new `big data visualization` and `real-time streaming data` visualization capabilities.

[VJMap](https://vjmap.com/en/) official website: https://vjmap.com/en/

# Features


- Fully compatible with `AutoCAD` `DWG` files, no conversion needed

- Map provides zoom in, zoom out, free zoom, pan, full map display and other functions. Supports mouse/single-finger drag, arrow keys for map panning, mouse wheel, double-click, two-finger for map zooming, Shift+box zoom. Supports flight, pan and other motion effects. Supports `map comparison` function. Can export PNG, PDF, SVG and other formats.

- Multi-view modes: Map supports `2D` and `3D` views, vertical view and 360-degree rotation view.

- Perfect combination of `CAD` and `GIS`: Map supports rendering CAD drawings as `raster tiles` and `vector tiles`, with `custom map` styles. Supports `WMS` format. Supports overlay display with `web maps`.

- Interactive map operations including click to view properties, layer toggle display, `spatial query` operations on GIS data.

- Supports `version control` for drawings. Provides `collaborative` drawing update functionality.

- Supports `drawing` on web: points, lines, polygons, circles, etc. Can save drawn graphics as DWG files. Supports coordinate `snapping`. Provides distance, angle, area `measurement` tools.

- Supports `overlays`, `clustering`, `info windows`, `heatmaps` and other common map features with rich JS APIs.

- Advanced rendering: Uses `WebGL` technology. No lag when overlaying 10,000+ user data points on CAD drawings. Supports `big data visualization`.

- `Cross-platform` server deployment (supports `Windows`, `Linux`). Supports `Docker` deployment. Map viewing fully compatible with `mobile` devices.

    