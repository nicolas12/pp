
/**
 * Initializes a visual role.
 * 
 * @name pvc.visual.Role
 * 
 * @class Represents a role that is somehow played by visualization.  
 * 
 * @property {string} name The name of the role.
 * 
 * @property {pvc.data.GroupingSpec} grouping The grouping specification currently bound to the visual role.
 * 
 * @property {boolean} isRequired Indicates that the role is required and must be satisfied.
 * 
 * @property {boolean} requireSingleDimension Indicates that the role can only be satisfied by a single dimension.
 * A {@link pvc.visual.Role} of this type must have an associated {@link pvc.data.GroupingSpec}
 * that has {@link pvc.data.GroupingSpec#isSingleDimension} equal to <tt>true</tt>.
 * 
 * @property {boolean} singleValueType When not nully, 
 * restricts the allowed value type of the single dimension of the 
 * associated {@link pvc.data.GroupingSpec} to this type.
 * 
 * @property {boolean|null} requireIsDiscrete
 * Indicates if 
 * only discrete, when <tt>true</tt>, 
 * continuous, when <tt>false</tt>, 
 * or any, when <tt>null</tt>,
 * groupings are accepted.
 * 
 * @property {string} defaultDimensionName The default dimension name.
 * 
 * @constructor
 * @param {string} name The name of the role.
 * @param {object} [keyArgs] Keyword arguments.
 * 
 * @param {boolean} [keyArgs.isRequired=false] Indicates a required role.
 * 
 * @param {boolean} [keyArgs.requireSingleDimension=false] Indicates that the role 
 * can only be satisfied by a single dimension. 
 * 
 * @param {boolean} [keyArgs.isMeasure=false] Indicates that <b>datums</b> that do not 
 * contain a non-null atom in any of the dimensions bound to measure roles should be readily excluded.
 * 
 * @param {boolean} [keyArgs.singleValueType] Restricts the allowed value type of the single dimension.
 * 
 * @param {boolean|null} [keyArgs.requireIsDiscrete=null] Indicates if the grouping should be discrete, continuous or any.
 * 
 * @param {string} [keyArgs.defaultDimensionName] The default dimension name.
 */
def.type('pvc.visual.Role')
.init(function(name, keyArgs){
    this.name = name;
    
    if(def.get(keyArgs, 'isRequired', false)) {
        this.isRequired = true;
    }
    
    var defaultDimensionName = def.get(keyArgs, 'defaultDimensionName'); 
    if(defaultDimensionName) {
        this.defaultDimensionName = defaultDimensionName;
    }
    
    var requireSingleDimension;
    var requireIsDiscrete = def.get(keyArgs, 'requireIsDiscrete'); // isSingleDiscrete
    if(requireIsDiscrete != null) {
        if(!requireIsDiscrete) {
            requireSingleDimension = true;
        }
    }
    
    if(requireSingleDimension != null) {
        requireSingleDimension = def.get(keyArgs, 'requireSingleDimension', false);
        if(requireSingleDimension) {
            if(def.get(keyArgs, 'isMeasure', false)) {
                this.isMeasure = true;
                
                if(def.get(keyArgs, 'isPercent', false)) {
                    this.isPercent = true;
                }
            }
            
            var singleValueType = def.get(keyArgs, 'singleValueType', null);
            if(singleValueType !== this.singleValueType) {
                this.singleValueType = singleValueType;
            }
        }
    }
    
    if(requireSingleDimension !== this.requireSingleDimension) {
        this.requireSingleDimension = requireSingleDimension;
    }
    
    if(requireIsDiscrete != this.requireIsDiscrete) {
        this.requireIsDiscrete = !!requireIsDiscrete;
    }
})
.add(/** @lends pvc.visual.Role# */{
    isRequired:        false,
    requireSingleDimension: false,
    singleValueType:   null,
    requireIsDiscrete: null,
    isMeasure:         false,
    isPercent:         false,
    defaultDimensionName: null,
    grouping: null,
    
    /** 
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string 
     */
    firstDimensionName: function(){
        return this.grouping && this.grouping.firstDimension.name;
    },
    
    /** 
     * Obtains the first dimension type that is bound to the role.
     * @type pvc.data.Dimension
     */
    firstDimension: function(){
        return this.grouping && this.grouping.firstDimension;
    },
    
    /**
     * Binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    bind: function(groupingSpec){
        if(groupingSpec) {
            if(groupingSpec.hasCompositeLevels) {
                throw def.error.argumentInvalid(def.format('visualRoles.{0}', [name]), "Role assigned to a composite level grouping, which is invalid.");
            }
            
            var singleDimSpec = groupingSpec.isSingleDimension ? groupingSpec.firstDimension : null;
            
            /** Validate grouping spec according to role */
            if(this.requireSingleDimension) {
                singleDimSpec || def.fail.operationInvalid("Role '{0}' only accepts a single dimension.", [this.name]);
                
                var dimType = singleDimSpec.type,
                    valueType = this.singleValueType;
                if(valueType && dimType.valueType !== valueType) {
                    throw def.error.operationInvalid(
                            "Role '{0}' cannot be bound to dimension '{1}'; it only accepts a single dimension of type '{2}' and not of type '{3}'.",
                            [this.name, dimType.name, pvc.data.DimensionType.valueTypeName(valueType), dimType.valueTypeName]);
                }
            }
            
            var requireIsDiscrete = this.requireIsDiscrete;
            if(requireIsDiscrete != null) {
                var isDiscrete = !singleDimSpec || singleDimSpec.type.isDiscrete;
                if(isDiscrete !== requireIsDiscrete) {
                    throw def.error.operationInvalid(
                            "Role '{0}' only accepts '{1}' groupings.", 
                            [this.name, requireIsDiscrete ? 'discrete' : 'continuous']);
                }
            }
        }
        
        // ----------
        
        if(this.grouping) {
            // unregister from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                dimType_removeVisualRole.call(dimSpec.type, this);  
            }, this);
        }
        
        this.grouping = groupingSpec;
        
        if(this.grouping) {
            // register from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                dimType_addVisualRole.call(dimSpec.type, this);  
            }, this);
        }
    }
});
