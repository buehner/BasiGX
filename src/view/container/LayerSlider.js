/* Copyright (c) 2015-present terrestris GmbH & Co. KG
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Layer Slider
 *
 * Used to change opacity on multiple layers by fading them in and out
 * one by one. Can be useful e.g. to slide 'through the time'
 *
 * Example usage:
 *
 * {
 *      xtype: 'basigx-slider-layer',
 *      layerNames: [
 *           'Luftbilder 1936',
 *           'Luftbilder 1971',
 *           'Luftbilder 1999'
 *      ],
 *      sliderTitles: [
 *           '1936',
 *           '1971',
 *           '1999'
 *      ],
 *      topTitle: 'Luftbilder',
 *      addOffState: false
 * }
 *
 * TODOs:
 *   * Handle problems that occur when layers are visible in tree and get
 *     checked / unchecked
 *   * Make the slider / label positioning more flexible / dynamic
 *
 * @class BasiGX.view.container.LayerSlider
 */
Ext.define('BasiGX.view.container.LayerSlider', {
    extend: 'Ext.container.Container',
    xtype: 'basigx-slider-layer',

    requires: [
        'Ext.slider.Single'
    ],

    /**
     *
     */
    viewModel: {
        data: {
            disabeldLabelHtml: 'Aus',
            documentation: '<h2>LayerSlider</h2>• Bewegen Sie den ' +
                'Schieberegler, um die Darstellung von einem Kartenthem ' +
                'zum nächsten in einem weichen Übergang darzustellen'
        }
    },

    /**
     *
     */
    sliderConfig: {
        flex: 6,
        value: 0,
        minValue: 0,
        maxValue: 100,
        useTips: false
    },

    /**
     *
     */
    width: 250,

    /**
     * Array gets filled with ol-layers by the given layernames
     */
    layers: [],

    /**
     * The titles for the layerslider items
     */
    sliderTitles: [],

    /**
     * the title appearing on top the slider
     */
    topTitle: null,

    /**
     * flag used to indicate that the slider should have an "off" state at the
     * beginning. When set to true, no slider-layer is initially visible
     */
    addOffState: true,

    /**
     * The index of the layer that should be active on init.
     * Slider will get set to the desired value
     */
    initialActiveLayerIdx: 0,

    /**
     * the cls
     */
    cls: 'layerSlider',

    /**
     *
     */
    initComponent: function() {
        var me = this;
        var map = BasiGX.util.Map.getMapComponent().getMap();
        var labelItems = me.getLabelItems();
        var items = [];

        me.layers = [];

        if (Ext.isEmpty(me.layerNames) || me.layerNames.length < 2) {
            Ext.log.error('Not enough layers given to slider!');
        } else {
            Ext.each(me.layerNames, function(ln) {
                me.addLayerByName(map.getLayers().getArray(), ln);
            });
        }
        if (me.layerNames.length !== me.layers.length) {
            Ext.log.error('Could not detect all layers by name!');
        }

        // set the colspan for slider
        me.config.colspan = me.addOffState ?
            me.layerNames.length + 1 : me.layerNames.length;
        var slider = Ext.create('Ext.slider.Single', me.sliderConfig);

        if (!Ext.isEmpty(me.topTitle)) {
            var titleContainer = {
                xtype: 'container',
                cls: 'sliderTopTitle',
                html: me.topTitle
            };
            items.push(titleContainer);
        }

        var labelContainer = {
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: labelItems
        };
        items.push(labelContainer);

        var sliderContainer = {
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'container',
                    flex: 1
                },
                slider,
                {
                    xtype: 'container',
                    flex: 1
                }
            ]
        };
        items.push(sliderContainer);

        me.items = items;

        me.callParent();

        slider.on('change', me.changeHandler);

        if (me.initialActiveLayerIdx > 0) {
            var sliderVal = slider.maxValue / (
                me.addOffState ? me.layers.length : me.layers.length - 1) *
                me.initialActiveLayerIdx;
            slider.setValue(sliderVal);
            slider.fireEvent('change', slider, sliderVal);
        }
    },

    /**
     * Returns the label items.
     *
     * @return {Array<Object>} The label items.
     */
    getLabelItems: function() {
        var me = this;
        var labelItems = [];

        if (me.addOffState) {
            // add the starter
            labelItems.push(
                {
                    xtype: 'container',
                    bind: {
                        html: '{disabeldLabelHtml}'
                    },
                    flex: 1,
                    cls: 'sliderLabel'
                }
            );
        }

        Ext.each(me.sliderTitles, function(title) {
            labelItems.push({
                xtype: 'container',
                html: title,
                flex: 1,
                cls: 'sliderLabel'
            });
        });
        return labelItems;
    },

    /**
     * Adds layers to a member variable by the given layernames.
     *
     * @param {ol.Collection} collection The collection to add the layer with
     *     the passed name to.
     * @param {String} ln The name of the layer to search and then add to the
     *     collection.
     */
    addLayerByName: function(collection, ln) {
        var me = this;
        Ext.each(collection, function(layer, idx) {
            if (layer.get('name') === ln) {
                if (!me.addOffState && idx === 0) {
                    // we have to set the first layer initially full visible
                    layer.set('opacity', 1);
                    layer.setVisible(true);
                } else {
                    // with addOffState, first layer must be opaque
                    layer.set('opacity', 0);
                    layer.setVisible(false);
                }
                layer.set('isSliderLayer', true);
                me.layers.push(layer);
                return false;
            }
            if (layer instanceof ol.layer.Group) {
                me.addLayerByName(layer.getLayers().getArray(), ln);
            }
        });
    },

    /**
     * Handling the opacity change on the configured layers.
     *
     * TODO This method should be rewritten with readability in mind.
     *
     * @param {Ext.slider.Slider} slider The slider.
     * @param {Number} value The position of the slider as number between
     *     `minValue` and `maxValue` of the slider.
     */
    changeHandler: function(slider, value) {
        var sliderContainer = this.up('basigx-slider-layer');
        var layers = sliderContainer.layers;
        var numLayers = layers.length;
        var swapRange = slider.maxValue / (
            sliderContainer.addOffState ? numLayers : numLayers - 1
        );

        if (value === slider.maxValue) {
            // maxValue breaks mathematics so we use maxValue -1;
            value = slider.maxValue - 1;
        }
        var idx = parseInt(value / swapRange, 10);

        // disable all layers in order to avoid unnecessary requests and
        // gain performance. enable required ones later...
        Ext.each(layers, function(layer) {
            layer.setVisible(false);
        });

        if (value >= swapRange || !sliderContainer.addOffState) {
            // need to break down the value to the corresponding range.
            // with e.g. 4 layers this will always be between 0 and 25
            value = value - swapRange * idx;

            if (!sliderContainer.addOffState) {
                sliderContainer.layers[idx].set('opacity', Math.abs(1 -
                        (value * layers.length / 100)));
                sliderContainer.layers[idx + 1].set('opacity',
                    value * layers.length / 100);

                sliderContainer.layers[idx].setVisible(true);
                sliderContainer.layers[idx + 1].setVisible(true);
            } else {
                sliderContainer.layers[idx - 1].set('opacity', Math.abs(1 -
                        (value * layers.length / 100)));
                sliderContainer.layers[idx].set('opacity',
                    value * layers.length / 100);

                sliderContainer.layers[idx - 1].setVisible(true);
                sliderContainer.layers[idx].setVisible(true);
            }
        } else {
            // we are on the first slide part and have an offState,
            // just fade in the first layer
            sliderContainer.layers[idx].set('opacity',
                value * layers.length / 100);
            sliderContainer.layers[idx].setVisible(true);
        }
    }
});
