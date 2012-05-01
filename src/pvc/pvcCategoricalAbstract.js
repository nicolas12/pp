
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){
        
        this.base(options);

        pvc.mergeDefaults(this.options, pvc.CategoricalAbstract.defaultOptions, options);
        
        this._axisRoleNameMap = {
            'base':  'category',
            'ortho': this.options.orthoAxisOrdinal ? 'series' : 'value'
        };
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        this.base(options);

        if(!options.stacked){
            options.percentageNormalized = false;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { isRequired: true, defaultDimensionName: 'category*' }
        });
    },
    
    /**
     * @override
     */
    _createVisibleData: function(){
        var catGrouping = this.visualRoles('category').grouping.singleLevelGrouping(),
            serGrouping = this.visualRoles('series'  ).grouping.singleLevelGrouping(),
            // One multi-dimensional, two-levels data grouping
            crossGrouping = pvc.data.GroupingSpec.multiple([catGrouping, serGrouping]);

        return this.dataEngine.groupBy(crossGrouping, { visible: true });
    },
    
    /**
     * Obtains the extent of the specified value role,
     * taking into account that values are shown for each category.
     * 
     * <p>
     * When more than one datum exists per series <i>and</i> category,
     * the sum of its values is considered.
     * </p>
     * 
     * @override
     */
    _getVisibleValueExtent: function(valueRole){
        switch(valueRole.name){
            case 'series':// (series throws in base)
            case 'category':
                /* Special case. 
                 * The category role's single dimension belongs to the grouping dimensions of data.
                 * As such, the default method is adequate.
                 * 
                 * Continuous baseScale's, like timeSeries go this way.
                 */
                return this.base(valueRole);
        }
        
        this._assertSingleContinuousValueRole(valueRole);
        
        var valueDimName = valueRole.firstDimensionName(),
            data = this._getVisibleData();
        
        if(!this.options.stacked){
            return data.leafs()
                       .select(function(serGroup){
                           return serGroup.dimensions(valueDimName).sum();
                        })
                       .range();
        }
        
        // _getCategoriesMaxSumOfVisibleSeries ...
        var max = data.children()
                    .select(function(catGroup){ return catGroup.dimensions(valueDimName).sum(); })
                    .max();
        
        return max != null ? {min: 0, max: max} : null;
    },
    
    /**
     * @override
     */
    _getVisibleValueExtentConstrained: function(axis, min, max){
        if(axis.type === 'ortho') {
            if(min == null) {
                if(this.options.stacked) {
                    // Includes percentageNormalized
                    min = 0;
                }
            }
            
            if(max == null) {
                if(this.options.percentageNormalized) {
                    max = 100;
                }
                // max of stacked is handled by _getVisibleValueExtent
            }
        }
        
        return this.base(axis, min, max);
    },
     
    /**
     * Scale for the second linear axis. yy if orientation is vertical, xx otherwise.
     *
     * Keyword arguments:
     *   bypassAxisOffset: boolean, default is false (only implemented for not independent scale)
     */
    getSecondScale: function(keyArgs){ // TODO

        var options = this.options;
        
        if(!options.secondAxis || !options.secondAxisIndependentScale){
            return this.getLinearScale(keyArgs);
        }
        
        // DOMAIN
        var dMax = this.dataEngine.getSecondAxisMax(),
            dMin = this.dataEngine.getSecondAxisMin();

        if(dMin * dMax > 0 && options.secondAxisOriginIsZero){
            if(dMin > 0){
                dMin = 0;
            } else {
                dMax = 0;
            }
        }

        // Adding a small offset to the scale's domain:
        var dOffset = (dMax - dMin) * options.secondAxisOffset,
            scale = new pv.Scale.linear(
                        dMin - (options.secondAxisOriginIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (options.secondAxisOriginIsZero && dMax == 0 ? 0 : dOffset));

        // Domain rounding
        pvc.roundScaleDomain(scale, options.secondAxisRoundDomain, options.secondAxisDesiredTickCount);
                
        // RANGE
        var isX = !this.isOrientationVertical();
        scale.min = 0;
        scale.max = isX ? this._mainContentPanel.width : this._mainContentPanel.height;
        scale.range(scale.min, scale.max);
        
        return scale;
    },
    
    markEventDefaults: {
        strokeStyle: "#5BCBF5",  /* Line Color */
        lineWidth: "0.5",  /* Line Width */
        textStyle: "#5BCBF5", /* Text Color */
        verticalOffset: 10, /* Distance between vertical anchor and label */
        verticalAnchor: "bottom", /* Vertical anchor: top or bottom */
        horizontalAnchor: "right", /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false, /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80 /* Horizontal anchor will switch if less than this space available */
    },
    
    // TODO: chart orientation?
    markEvent: function(dateString, label, options){

        if(!this.options.timeSeries){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        var baseScale = this.axes.base.scale;
            //{ bypassAxisOffset: true }); // TODO: why bypassAxisOffset ?

        // Are we outside the allowed scale?
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = baseScale(d),
            range = baseScale.range();
        
        if( dpos < range[0] || dpos > range[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this._mainContentPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        //var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor ){
            var availableSize = o.horizontalAnchor == "right"? range[1]- dpos : dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right" ? "left" : "right";
            }
        }

        var line = panel.add(pv.Line)
            .data([0,h])
            .strokeStyle(o.strokeStyle)
            .lineWidth(o.lineWidth)
            .bottom(function(d){
                return d;
            })
            .left(dpos);

        //var pvLabel = 
        line.anchor(o.horizontalAnchor)
            .top(o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(){
                return this.index == 0;
            });
    }
}, {
    defaultOptions: {
        // Ortho <- value role
        orthoAxisOrdinal: false, // when true => _axisRoleNameMap['ortho'] = 'series' (instead of value)
        
        stacked: false,
        
        percentageNormalized: false
    }
});
