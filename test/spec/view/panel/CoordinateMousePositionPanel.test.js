Ext.Loader.syncRequire(['BasiGX.view.panel.CoordinateMousePositionPanel']);

describe('BasiGX.view.panel.CoordinateMousePositionPanel', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(BasiGX.view.panel.CoordinateMousePositionPanel)
                .to.not.be(undefined);
        });

        it('can be instantiated', function() {
            var inst = Ext.create('BasiGX.view.panel.CoordinateMousePositionPanel');
            expect(inst).to.be.a(BasiGX.view.panel.CoordinateMousePositionPanel);
            // teardown
            inst.destroy();
        });
    });
});
