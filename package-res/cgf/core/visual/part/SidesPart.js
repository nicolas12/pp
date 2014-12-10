/**
 * @name cgf.visual.SidesPart
 * @class A part template for margin, padding and position properties.
 * @extends cgf.dom.PartTemplate
 */
cgf.SidesPart = defTemplate(cgf_visual, 'SidesPart', cgf.dom.PartTemplate.extend({
    methods: /** @lends cgf.visual.SidesPart# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.visual.SidesPart#all all}.
         * Also, all other sides' properties are reset.
         *
         * @param {any} value A value, not identical to `this`, to configure from.
         * @return {boolean} Always returns <tt>true</tt>.
         */
        tryConfigure: function(all) {
            this.all(all)
                .left(null)
                .right(null)
                .top(null)
                .bottom(null);
            return true;
        }
    },
    properties: [
        /**
         * Gets or sets the `all` sides size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.allSides}.
         *
         * The `all` value is the default value of all the other
         * four "sides" properties:
         * {@link cgf.visual.SidesPart#left left},
         * {@link cgf.visual.SidesPart#right right},
         * {@link cgf.visual.SidesPart#top top} and
         * {@link cgf.visual.SidesPart#bottom bottom}.
         *
         * @name cgf.visual.SidesPart#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.visual.SidesPart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property allSides
         */
        cgf_visual_props.allSides,

        /**
         * Gets or sets the left side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.left}.
         *
         * @name cgf.visual.SidesPart#left
         * @method
         * @param {function|string|number} [left] The left value.
         * @return {cgf.visual.SidesPart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property left
         */
        cgf_visual_props.left,

        /**
         * Gets or sets the top side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.top}.
         *
         * @name cgf.visual.SidesPart#top
         * @method
         * @param {function|string|number} [right] The top value.
         * @return {cgf.visual.SidesPart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property top
         */
        cgf_visual_props.top,

        /**
         * Gets or sets the right side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.right}.
         *
         * @name cgf.visual.SidesPart#right
         * @method
         * @param {function|string|number} [right] The right value.
         * @return {cgf.visual.SidesPart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property right
         */
        cgf_visual_props.right,

        /**
         * Gets or sets the bottom side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.bottom}.
         *
         * @name cgf.visual.SidesPart#bottom
         * @method
         * @param {function|string|number} [bottom] The bottom value.
         * @return {cgf.visual.SidesPart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property bottom
         */
        cgf_visual_props.bottom
    ],
    element: {
        /**
         * @class The element class of the {@link cgf.visual.SidesPart} template.
         * @name cgf.visual.SidesPart.Element
         *
         * @property {number} all Gets the resolved "all sides" size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.allSides}.
         *
         * @property {number} left Gets the resolved left side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.left}.
         *
         * @property {number} right Gets the resolved right side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.right}.
         *
         * @property {number} top Gets the resolved top side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.top}.
         *
         * @property {number} bottom Gets the resolved bottom side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.bottom}.
         */
        methods: /** cgf.visual.SidesPart.Element# */{
            /**
             * Gets the sum of the resolved horizontal sides.
             *
             * Returns `null` if both sides are `null`.
             *
             * @type {number|null}
             */
            get width() {
                var l = this.left, r = this.right;
                return (l == null && r == null) ? null : ((l || 0) + (r || 0));
            },

            /**
             * Gets the sum of the resolved vertical sides.
             *
             * Returns `null` if both sides are `null`.
             *
             * @type {number|null}
             */
            get height() {
                var t = this.top, b = this.bottom;
                return (t == null && b == null) ? null : ((t || 0) + (b || 0));
            }
        }
    }
}));

cgf_visual.SidesPart.type().add({
    defaults: new cgf_visual.SidesPart()
        .left(cgf_getAll)
        .right(cgf_getAll)
        .top(cgf_getAll)
        .bottom(cgf_getAll)
});
