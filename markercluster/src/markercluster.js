/**
 * @name MarkerCluster
 * @version 1.0
 * @author Xiaoxi Wu
 * @copyright (c) 2009 Xiaoxi Wu
 * @fileoverview This javascript library gives you a class to manage
 *  marker by clustering, so that you can add many markers (maybe
 * hundreds or thousands) with a high speed and more clear layout.<br />
 * The idea of this library came from http://www.mapeed.com.<br />
 * <b>How it works</b>:<br/>
 * A marker cluster will group markers into clusters according to
 * its distance from cluster's center. When a marker is added,
 * the marker cluster will find a position in all the clusters, if failed,
 * a new cluster will be created, centered by this marker and the
 * marker is also added. The number of markers in a cluster will be showed
 * on the cluster marker.<br />
 * When the map status changed (moved or zoomed), MarkerCluster will
 * destroy the clusters in viewport and regroup them into new clusters.<br />
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * @name MarkerClusterOptions
 * @class This class represents optional arguments to the {@link MarkerCluster}
 * constructor.
 * @property {Number} [maxZoom] The max zoom level monitored by a
 * marker cluster. If not given, the marker cluster assumes the maximum map
 * zoom level. When maxZoom is reached or exceeded all marker will be showed
 * without cluster.
 * @property {Number} [gridSize=60] The grid size of a cluster in pixel. Each
 * cluster will be a square. If you want marker cluster faster you can set
 * this value larger.
 * @property {Array of Object} [clusterImages] Custom images of cluster marker:
 *   {String} [url] Image url.
 *   {Number} [size] Image size, image should be square.
 *   Note: The marker cluster have different level of clusters depending on
 *   the numbers of markers in cluster, different level will have different
 *   image of cluster marker.
 *   level 0: 2-9, level1: 10-99, level2: 100-999 ...
 */

/**
 * Create a new MarkerCluste to manage markers on map.
 *
 * @constructor
 * @param {GMap2} map The map where MarkerCluster should be add.
 * @param {Array of GMarker} opt_markers Markers you want to add.
 * @param {Object} opt_opts A container for optional arguments:
 *   {Number} maxZoom Max zoom level that marker cluster support.
 *   {Number} gridSize The size of a cluster in pixel.
 *   {Array of Object} clusterImages Custom images of cluster marker.
 */
function MarkerCluster(map, opt_markers, opt_opts) {
  // private members
  var clusters_ = [];
  var map_ = map;
  var maxZoom_ = 17;
  var me_ = this;
  var gridSize_ = 60;
  var sizes = [53, 56, 66, 78, 90];
  var imgs_ = [];
  var leftMarkers_ = [];

  var i = 0;
  for (i = 1; i <= 5; ++i) {
    imgs_.push({
      'url': "http://jsbackyard.appspot.com/gmm/img/m" + i + ".png",
      'size': sizes[i - 1]
    });
  }

  var mapTypes = map.getMapTypes();
  maxZoom_ = mapTypes[0].getMaximumResolution();
  for (i = 0; i < mapTypes.length; i++) {
    var mapTypeMaxZoom = mapTypes[i].getMaximumResolution();
    if (mapTypeMaxZoom > maxZoom_) {
      maxZoom_ = mapTypeMaxZoom;
    }
  }

  if (typeof opt_opts === "object" && opt_opts !== null) {
    if (typeof opt_opts.gridSize === "number" && opt_opts.gridSize > 0) {
      gridSize_ = opt_opts.gridSize;
    }
    if (typeof opt_opts.maxZoom === "number") {
      maxZoom_ = opt_opts.maxZoom;
    }
    if (typeof opt_opts.clusterImages === "object" && opt_opts.clusterImages !== null && opt_opts.clusterImages.length === 0) {
      imgs_ = opt_opts.clusterImages;

    }
  }

  function addLeftMarkers_() {
    if (leftMarkers_.length === 0) {
      return;
    }
    var leftMarkers = [];
    for (i = 0; i < leftMarkers_.length; ++i) {
      me_.addMarker(leftMarkers_[i], true, null, null, true);
    }
    leftMarkers_ = leftMarkers;
  }

  /**
   * Get cluster marker images of this marker cluster. Mostly used by {@link Cluster_}
   */
  this.getImgs = function () {
    return imgs_;
  };

  /**
   * Destroy the marker cluster.
   */
  this.destroy = function () {
    for (var i = 0; i < clusters_.length; ++i) {
      if (typeof clusters_[i] !== "undefined" && clusters_[i] !== null) {
        clusters_[i].destroy();
      }
    }
    clusters_ = [];
  };

  function isMarkerInViewport_(marker) {
    return map_.getBounds().containsLatLng(marker.getLatLng());
  }

  function reAddMarkers_(markers) {
    var len = markers.length;
    var clusters = [];
    for (var i = len - 1; i >= 0; --i) {
      me_.addMarker(markers[i].marker, true, markers[i].isAdded, clusters, true);
    }
    addLeftMarkers_();
  }

  /**
   * Add a marker.
   *
   * @param {GMarker} marker Marker you want to add
   * @param {Boolean} opt_isNodraw Whether redraw the cluster contained the marker
   * @param {Boolean} opt_isAdded Whether the marker is added to map. Never use it.
   * @param {Array of Cluster_} opt_clusters Provide a list of clusters, the marker
   *     cluster will only check these cluster where the marker should join.
   */
  this.addMarker = function (marker, opt_isNodraw, opt_isAdded, opt_clusters, opt_isNoCheck) {
    if (opt_isNoCheck !== true) {
      if (!isMarkerInViewport_(marker)) {
        leftMarkers_.push(marker);
        return;
      }
    }

    var isAdded = opt_isAdded;
    var clusters = opt_clusters;
    var pos = map_.fromLatLngToDivPixel(marker.getLatLng());

    if (typeof isAdded !== "boolean") {
      isAdded = false;
    }
    if (typeof clusters !== "object" || clusters === null) {
      clusters = clusters_;
    }

    var length = clusters.length;
    var cluster = null;
    for (var i = length - 1; i >= 0; i--) {
      cluster = clusters[i];
      var center = cluster.getCenter();
      if (center === null) {
        continue;
      }
      center = map_.fromLatLngToDivPixel(center);

      // Found a cluster which contains the marker.
      if (pos.x >= center.x - gridSize_ && pos.x <= center.x + gridSize_ &&
          pos.y >= center.y - gridSize_ && pos.y <= center.y + gridSize_) {
        cluster.addMarker({
          'isAdded': isAdded,
          'marker': marker
        });
        if (!opt_isNodraw) {
          cluster.redraw();
        }
        return;
      }
    }

    // No cluster contain the marker, create a new cluster.
    cluster = new Cluster_(this, map);
    cluster.addMarker({
      'isAdded': isAdded,
      'marker': marker
    });
    if (!opt_isNodraw) {
      cluster.redraw();
    }

    // Add this cluster both in clusters provided and clusters_
    clusters.push(cluster);
    if (clusters !== clusters_) {
      clusters_.push(cluster);
    }
  };

  /**
   * Remove a marker.
   *
   * @param {GMarker} marker The marker you want to remove.
   */

  this.removeMarker = function (marker) {
    for (var i = 0; i < clusters_.length; ++i) {
      if (clusters_[i].remove(marker)) {
        clusters_[i].redraw();
        return;
      }
    }
  };

  /**
   * Redraw all clusters in viewport.
   */
  this.redraw = function () {
    var clusters = this.getClustersInViewport();
    for (var i = 0; i < clusters.length; ++i) {
      clusters[i].redraw(true);
    }
  };

  /**
   * Get all clusters in viewport.
   * @return {Array of Cluster_}
   */
  this.getClustersInViewport = function () {
    var clusters = [];
    var curBounds = map_.getBounds();
    var sw = map_.fromLatLngToDivPixel(curBounds.getSouthWest());
    var ne = map_.fromLatLngToDivPixel(curBounds.getNorthEast());
    for (var i = 0; i < clusters_.length; i ++) {
      if (clusters_[i].isInViewport(sw, ne)) {
        clusters.push(clusters_[i]);
      }
    }
    return clusters;
  };

  /**
   * Get max zoom level.
   */
  this.getMaxZoom = function () {
    return maxZoom_;
  };

  /**
   * Get map object.
   */
  this.getMap = function () {
    return map_;
  };

  this.getGridSize = function () {
    return gridSize_;
  };

  /**
   * Get total number of markers.
   * @return {Number}
   */
  this.count = function () {
    var result = 0;
    for (var i = 0; i < clusters_.length; ++i) {
      result += clusters_[i].count();
    }
    return result;
  };

  /**
   * Get total number of clusters.
   * @return {int}
   */
  this.getClustersCount = function () {
    return clusters_.length;
  };

  /**
   * Collect all markers of clusters in viewport and regroup them.
   */
  this.resetViewport = function () {
    var clusters = this.getClustersInViewport();
    var tmpMarkers = [];
    var removed = 0;

    for (var i = 0; i < clusters.length; ++i) {
      var cluster = clusters[i];
      var oldZoom = cluster.getZoom();
      if (oldZoom === null) {
        continue;
      }
      var curZoom = map_.getZoom();
      if (curZoom !== oldZoom) {

        // If the cluster zoom level changed then destroy the cluster
        // and collect its markers.
        var mks = cluster.getMarkers();
        for (var j = 0; j < mks.length; ++j) {
          var newMarker = {
            'isAdded': mks[j].isAdded,
            'marker': mks[j].marker
          };
          tmpMarkers.push(newMarker);
        }
        cluster.destroy();
        removed++;
        for (j = 0; j < clusters_.length; ++j) {
          if (cluster === clusters_[j]) {
            clusters_.splice(j, 1);
          }
        }
      }
    }

    // Add the markers collected into marker cluster to reset
    reAddMarkers_(tmpMarkers);
    this.redraw();
  };


  /**
   * Add some markers.
   * Add many markers one time will much faster then add these markers one by one.
   *
   * @param {Array of GMarker} markers The markers you want to add.
   */
  this.addMarkers = function (markers) {
    for (var i = 0; i < markers.length; ++i) {
      this.addMarker(markers[i], true);
    }
    this.redraw();
  };

  // initialize
  if (typeof opt_markers === "object" && opt_markers !== null) {
    this.addMarkers(opt_markers);
  }
  // when map move end, regroup.
  GEvent.addListener(map_, "moveend", function () {
    me_.resetViewport();
  });
}

/**
 * Create a cluster to collect markers.
 * A cluster includes some markers which are in a block of area.
 * If there are more than one markers in cluster, the cluster
 * will create a {@link ClusterMarker_} and show the total number
 * of markers in cluster.
 *
 * @constructor
 * @param {MarkerCluster} markerCluster The marker cluster object
 */
function Cluster_(markerCluster) {
  var center_ = null;
  var markers_ = [];
  var markerCluster_ = markerCluster;
  var map_ = markerCluster.getMap();
  var clusterMarker_ = null;
  var zoom_ = null;

  /**
   * Get markers of this cluster.
   *
   * @return {Array of GMarker}
   */
  this.getMarkers = function () {
    return markers_;
  };

  /**
   * If this cluster in viewport.
   *
   * @param {GLatLng} opt_sw The south-west point. if not provided, use
   *     current map viewport.
   * @param {GLatLng} opt_ne The north-east point. if not provided, use
   *     current map viewport.
   * @return {Boolean}
   */
  this.isInViewport = function (opt_sw, opt_ne) {
    if (center_ === null) {
      return false;
    }
    var sw = opt_sw;
    var ne = opt_ne;
    if (!(sw instanceof GLatLng && ne instanceof GLatLng)) {
      var curBounds = map_.getBounds();
      sw = map_.fromLatLngToDivPixel(curBounds.getSouthWest());
      ne = map_.fromLatLngToDivPixel(curBounds.getNorthEast());
    }

    var centerxy = map_.fromLatLngToDivPixel(center_);
    var inViewport = true;
    var gridSize = markerCluster.getGridSize();
    if (zoom_ !== map_.getZoom()) {
      var dl = map_.getZoom() - zoom_;
      gridSize = Math.pow(2, dl) * gridSize;
    }
    if (ne.x !== sw.x && (centerxy.x + gridSize < sw.x || centerxy.x - gridSize > ne.x)) {
      inViewport = false;
    }
    if (inViewport && (centerxy.y + gridSize < ne.y || centerxy.y - gridSize > sw.y)) {
      inViewport = false;
    }
    return inViewport;
  };

  /**
   * Get cluster center.
   *
   * @return {GLatLng}
   */
  this.getCenter = function () {
    return center_;
  };

  /**
   * Add a marker.
   *
   * @param {Object} marker An object of marker you want to add:
   *   {Boolean} isAdded If the marker is added on map.
   *   {GMarker} marker The marker you want to add.
   */
  this.addMarker = function (marker) {
    if (center_ === null) {
      /*var pos = marker['marker'].getLatLng();
       pos = map.fromLatLngToContainerPixel(pos);
       pos.x = parseInt(pos.x - pos.x % (GRIDWIDTH * 2) + GRIDWIDTH);
       pos.y = parseInt(pos.y - pos.y % (GRIDWIDTH * 2) + GRIDWIDTH);
       center = map.fromContainerPixelToLatLng(pos);*/
      center_ = marker.marker.getLatLng();
    }
    markers_.push(marker);
  };

  /**
   * Remove a marker from cluster.
   *
   * @param {GMarker} marker The marker you want to remove.
   * @return {Boolean} Whether find the marker to be removed.
   */
  this.removeMarker = function (marker) {
    for (var i = 0; i < markers_.length; ++i) {
      if (marker === markers_[i].marker) {
        if (markers_[i].isAdded) {
          map_.removeOverlay(markers_[i].marker);
        }
        markers_.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  /**
   * Get current zoom level of this cluster.
   * Note: the cluster zoom level and map zoom level not always the same.
   *
   * @return {Number}
   */
  this.getZoom = function () {
    return zoom_;
  };

  /**
   * Redraw a cluster.
   *
   * @param {Boolean} isForce If redraw by force, no matter if the cluster is
   *     in viewport.
   */
  this.redraw = function (isForce) {
    if (!isForce && !this.isInViewPort()) {
      return;
    }

    // Set cluster zoom level.
    zoom_ = map_.getZoom();
    var i = 0;
    if (zoom_ >= markerCluster.getMaxZoom() || this.count() === 1) {

      // If current zoom level is beyond the max zoom level or the cluster
      // have only one marker, the marker(s) in cluster will be showed on map.
      for (i = 0; i < markers_.length; ++i) {
        if (markers_[i].isAdded) {
          if (markers_[i].marker.isHidden()) {
            markers_[i].marker.show();
          }
        } else {
          map_.addOverlay(markers_[i].marker);
          markers_[i].isAdded = true;
        }
      }
      if (clusterMarker_ !== null) {
        clusterMarker_.hide();
      }
    } else {
      // Else add a cluster marker on map to show the number of markers in
      // this cluster.
      for (i = 0; i < markers_.length; ++i) {
        if (markers_[i].isAdded && (!markers_[i].marker.isHidden())) {
          markers_[i].marker.hide();
        }
      }
      if (clusterMarker_ === null) {
        clusterMarker_ = new ClusterMarker_(center_, this.count(), markerCluster_.getImgs(), markerCluster_.getGridSize());
        map_.addOverlay(clusterMarker_);
      } else {
        if (clusterMarker_.isHidden()) {
          clusterMarker_.show();
        }
        clusterMarker_.redraw(true);
      }
    }
  };

  /**
   * Destroy cluster.
   */
  this.destroy = function () {
    if (clusterMarker_ !== null) {
      map_.removeOverlay(clusterMarker_);
    }
  };

  /**
   * Get number of markers.
   * @return {Number}
   */
  this.count = function () {
    return markers_.length;
  };
}

/**
 * ClusterMarker creates a marker that shows the number of markers that
 * a cluster contains.
 *
 * @constructor
 * @param {GLatLng} latlng Marker's lat and lng.
 * @param {Number} count Number to show.
 * @param {Array of Object} imgs The image list to be showed:
 *   {String} url Image url.
 *   {Number} size Image size.
 * @param {Number} padding Padding of marker center.
 */
function ClusterMarker_(latlng, count, imgs, padding) {
  var index = 0;
  var dv = count;
  while (dv !== 0) {
    dv = parseInt(dv / 10, 10);
    index ++;
  }

  if (imgs.length < index) {
    index = imgs.length;
  }
  this.url_ = imgs[index - 1].url;
  this.size_ = imgs[index - 1].size;
  this.latlng_ = latlng;
  this.index_ = index;
  this.imgs_ = imgs;
  this.text_ = count;
  this.padding_ = padding;
}

ClusterMarker_.prototype = new GOverlay();

ClusterMarker_.prototype.initialize = function (map) {
  this.map_ = map;
  var div = document.createElement("div");
  var latlng = this.latlng_;
  var pos = map.fromLatLngToDivPixel(latlng);
  pos.x -= parseInt(this.size_ / 2, 10);
  pos.y -= parseInt(this.size_ / 2, 10);
  var mstyle = "";
  if (document.all) {
    mstyle = 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale,src="' + this.url_ + '");';
  } else {
    mstyle = "background:url(" + this.url_ + ");";
  }

  div.style.cssText = mstyle + "width:" + this.size_ + "px;height:" + this.size_ +
    "px;cursor:pointer;top:" + pos.y + "px;left:" + pos.x + "px;color:white;" +
    "line-height:" + this.size_ + "px;position:absolute;" +
    "text-align:center;font-size:11px;";
  div.innerHTML = this.text_;
  map.getPane(G_MAP_MAP_PANE).appendChild(div);
  var padding = this.padding_;
  GEvent.addDomListener(div, "click", function () {
    var pos = map.fromLatLngToDivPixel(latlng);
    var sw = {
      x: pos.x - padding,
      y: pos.y + padding
    };
    sw = map.fromDivPixelToLatLng(sw);
    var ne = {
      x: pos.x + padding,
      y: pos.y - padding
    };
    ne = map.fromDivPixelToLatLng(ne);
    var zoom = map.getBoundsZoomLevel(new GLatLngBounds(sw, ne));
    map.setCenter(latlng, zoom);
  });
  this.div_ = div;
};

ClusterMarker_.prototype.remove = function () {
  this.div_.parentNode.removeChild(this.div_);
};

ClusterMarker_.prototype.copy = function () {
  return new ClusterMarker_(this.latlng_, this.index_, this.text_, this.imgs_, this.padding_);
};

ClusterMarker_.prototype.redraw = function (force) {
  if (!force) {
    return;
  }
  var pos = this.map_.fromLatLngToDivPixel(this.latlng_);
  pos.x -= parseInt(this.size_ / 2, 10);
  pos.y -= parseInt(this.size_ / 2, 10);
  this.div_.style.top =  pos.y + "px";
  this.div_.style.left = pos.x + "px";
};

ClusterMarker_.prototype.hide = function () {
  this.div_.style.display = "none";
};

ClusterMarker_.prototype.show = function () {
  this.div_.style.display = "";
};

ClusterMarker_.prototype.isHidden = function () {
  return this.div_.style.display === "none";
};
