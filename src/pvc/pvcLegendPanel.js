/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Legend panel. Generates the legend. Specific options are:
 * <i>legendPosition</i> - top / bottom / left / right. Default: bottom
 * <i>legendSize</i> - The size of the legend in pixels. Default: 25
 *
 * Has the following protovis extension points:
 *
 * <i>legend_</i> - for the legend Panel
 * <i>legendRule_</i> - for the legend line (when applicable)
 * <i>legendDot_</i> - for the legend marker (when applicable)
 * <i>legendLabel_</i> - for the legend label
 * 
 */
def
.type('pvc.LegendPanel', pvc.BasePanel)
.init(function(chart, parent, options) {
    
    this.base(chart, parent, options);
    
    if(options.font === undefined) {
        var extFont = this._getConstantExtension('label', 'font');
        if(extFont) { this.font = extFont; }
    }

    // Undo base Clickable handling.
    // It doesn't matter if the chart's clickable is false.
    // Legend clickable depends on each legend group scene's clickMode.
    var I = pvc.visual.Interactive;
    if(this._ibits & I.Interactive) { this._ibits |= I.Clickable; }
})
.add({
    pvRule: null,
    pvDot: null,
    pvLabel: null,
    
    anchor: 'bottom',
    
    pvLegendPanel: null,
    
    textMargin:  6,    // The space *between* the marker and the text, in pixels.
    itemPadding: 2.5,  // Half the space *between* legend items, in pixels.
    itemSize:    null, // Item size, including padding. When unspecified, item size is dependent on each items text.
    markerSize:  15,   // *diameter* of marker *zone* (the marker itself may be a little smaller)
    font:  '10px sans-serif',

    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        return this._getBulletRootScene().layout(layoutInfo);
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var clientSize = layoutInfo.clientSize,
          rootScene = this._getBulletRootScene(),
          itemPadding = rootScene.vars.itemPadding,
          contentSize = rootScene.vars.contentSize;
      
       // Names are for horizontal layout (anchor = top or bottom)
      var isHorizontal = this.isAnchorTopOrBottom();
      var a_top    = isHorizontal ? 'top' : 'left';
      var a_bottom = this.anchorOpposite(a_top);    // bottom or right
      var a_width  = this.anchorLength(a_top);      // width or height
      var a_height = this.anchorOrthoLength(a_top); // height or width
      var a_center = isHorizontal ? 'center' : 'middle';
      var a_left   = isHorizontal ? 'left' : 'top';
      var a_right  = this.anchorOpposite(a_left);   // right or bottom
      
      // When V1 compat or size is fixed to less/more than content needs, 
      // it is still needed to align content inside
      
      // We align all rows left (or top), using the length of the widest row.
      // So "center" is a kind of centered-left align?
      
      var leftOffset = 0;
      switch(this.align){
          case a_right:
              leftOffset = clientSize[a_width] - contentSize.width;
              break;
              
          case a_center:
              leftOffset = (clientSize[a_width] - contentSize.width) / 2;
              break;
      }
      
      this.pvPanel.overflow("hidden");
      
      // SECTION - A panel instance per section
      var pvLegendSectionPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.vars.sections) // sections are "lists" of bullet item scenes
          [a_left  ](leftOffset)
          [a_top   ](function() {
              var prevSection = this.sibling(); 
              return prevSection ? (prevSection[a_top] + prevSection[a_height] + itemPadding[a_height]) : 0;
          })
          [a_width ](function(section) { return section.size[a_width ]; })
          [a_height](function(section) { return section.size[a_height]; });
      
      var wrapper;
      if(this.compatVersion() <= 1) {
          wrapper = function(v1f) {
              return function(itemScene) { return v1f.call(this, itemScene.vars.value.rawValue); };
          };
      }
      
      // SECTION > ITEM - A pvLegendPanel instance per bullet item in a section
      var pvLegendItemPanel = this.pvLegendPanel = new pvc.visual.Panel(this, pvLegendSectionPanel, {
              extensionId:   'panel',
              wrapper:       wrapper,
              noSelect:      false,
              noHover:       true,
              noClick:       false, // see also #_onClick below and constructor change of Clickable
              noClickSelect: true   // just rubber-band (the click is for other behaviors)
          })
          .pvMark
          .lock('data', function(section) { return section.items; }) // each section has a list of bullet item scenes
          [a_right](null)
          [a_bottom](null)
          [a_left](function(clientScene) {
              var itemPadding = clientScene.vars.itemPadding;
              var prevItem = this.sibling();
              return prevItem ?
                     (prevItem[a_left] + prevItem[a_width] + itemPadding[a_width]) :
                     0;
          })
          [a_top](isHorizontal ?
              // Center items in row's height, that may be taller than the item
              function(itemScene) {
                  var vars = itemScene.vars;
                  return vars.section.size.height / 2 - vars.itemClientSize.height / 2;
              } :
              // Left align items of a same column
              0)
          ['height'](function(itemScene) { return itemScene.vars.itemClientSize.height; })
          ['width'](isHorizontal ?
              function(itemScene) { return itemScene.vars.itemClientSize.width; } :
              
               // The biggest child width of the column
              function(/*itemScene*/) { return this.parent.width(); })
          .def("hidden", "false")
          .fillStyle(function() { // TODO: ??
              return this.hidden() == "true" ? 
                     "rgba(200,200,200,1)" : 
                     "rgba(200,200,200,0.0001)";
          });
          
      // SECTION > ITEM > MARKER
      var pvLegendMarkerPanel = new pvc.visual.Panel(this, pvLegendItemPanel, {
              extensionId: 'markerPanel'
          })
          .pvMark
          .left(0)
          .top (0)
          .right (null)
          .bottom(null)
          .width (function(itemScene){ return itemScene.vars.markerSize; })
          .height(function(itemScene){ return itemScene.vars.itemClientSize.height; })
          ;
      
      if(pvc.debug >= 20) {
          pvLegendSectionPanel.strokeStyle('red');
          pvLegendItemPanel.strokeStyle('green');
          pvLegendMarkerPanel.strokeStyle('blue');
      }
      
      /* RULE/MARKER */
      rootScene.childNodes.forEach(function(groupScene) {
          var pvGroupPanel = new pvc.visual.Panel(this, pvLegendMarkerPanel)
                  .pvMark
                  .visible(function(itemScene) { return itemScene.parent === groupScene; });
          
          groupScene.renderer().create(this, pvGroupPanel, groupScene.extensionPrefix, wrapper);
      }, this);

      /* LABEL */
      this.pvLabel = new pvc.visual.Label(this, pvLegendMarkerPanel.anchor('right'), {
              extensionId: 'label',
              noTooltip:   false,
              noClick:     false,
              wrapper:     wrapper
          })
          .intercept('textStyle', function(itemScene) {
              var baseTextStyle = this.delegateExtension() || "black";
              return itemScene.isOn() ? 
                  baseTextStyle : 
                  pvc.toGrayScale(baseTextStyle, null, undefined, 150);
          })
          .pvMark
          .textAlign('left') // panel type anchors don't adjust textAlign this way
          .text(function(itemScene) {
            var vars = itemScene.vars;
            return pvc.text.trimToWidthB(
              vars.labelWidthMax,
              itemScene.labelText(),
              vars.font,
              "..",
              false);
          })
          .lock('textMargin', function(itemScene) { return itemScene.vars.textMargin; })
          .font(function(itemScene) { return itemScene.vars.font; })
          .textDecoration(function(itemScene) { return itemScene.isOn() ? "" : "line-through"; });
      
      if(pvc.debug >= 16) {
          pvLegendMarkerPanel.anchor("right")
              // Single-point panel (w=h=0)
              .add(pv.Panel)
                  [this.anchorLength()](0)
                  [this.anchorOrthoLength()](0)
                  .fillStyle(null)
                  .strokeStyle(null)
                  .lineWidth(0)
               .add(pv.Line)
                  .data(function(scene) {
                      var vars = scene.vars;
                      var labelBBox  = pvc.text.getLabelBBox(
                              vars.textSize.width,
                              vars.textSize.height * 2/3,
                              'left', 
                              'middle',
                              0,
                              vars.textMargin);
                      var corners = labelBBox.source.points();
                      
                      // Close the path
                      // not changing corners on purpose
                      if(corners.length > 1) { corners = corners.concat(corners[0]); }
                      
                      return corners;
                  })
                  .left(function(p) { return p.x; })
                  .top (function(p) { return p.y; })
                  .strokeStyle('red')
                  .lineWidth(0.5)
                  .strokeDasharray('-');
      }
    },

    _onClick: function(context) {
        var scene = context.scene;
        if(def.fun.is(scene.execute) && scene.executable()) { 
            scene.execute(); 
        }
    },
    
    _getExtensionPrefix: function() { return 'legend'; },
    _getExtensionId:     function() { return 'area';   },
    
    // Catches both the marker and the label.
    // Also, if selection changes, renderInteractive re-renders these.
    _getSelectableMarks: function() { return [this.pvLegendPanel]; },
    
    _getBulletRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            // The legend root scene contains all datums of its chart
            rootScene = new pvc.visual.legend.BulletRootScene(null, {
                panel:       this, 
                source:      this.chart.data,
                horizontal:  this.isAnchorTopOrBottom(),
                font:        this.font,
                markerSize:  this.markerSize,
                textMargin:  this.textMargin, 
                itemPadding: this.itemPadding,
                itemSize:    this.itemSize
            });
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    },

    _getTooltipFormatter: function(tipOptions) {
        tipOptions.isLazy = false;
        return function(context) { 
          var valueVar = context.scene.vars.value;
          return valueVar.absLabel || valueVar.label;
        };
    }
});