export class GameMap {

    constructor(scene, layersData, tilesets, tileSize) {
        this.scene = scene;
        this.layersData = layersData;
        this.tilesets = tilesets;
        this.tileLayers = {};
        this.tileSize = tileSize;

        this.create();
    }

    toPhaserData(matrix) {
        return matrix.map(row => row.map(v => (v === 0 ? -1 : v - 1)));
    }


    create() {
        for (const [layerName, matrix] of Object.entries(this.layersData)) {
            
            const map = this.scene.make.tilemap({
                data: this.toPhaserData(matrix),
                tileWidth: this.tileSize,
                tileHeight: this.tileSize,
            });

            const tilesetKey = this.tilesets[layerName];

            const tileset = map.addTilesetImage(tilesetKey, null, this.tileSize, this.tileSize);

            const layer = map.createLayer(0, tileset, 0, 0);
            this.tileLayers[layerName] = layer;
        }

    }

    getTileLayer(layerName) {
        return this.tileLayers[layerName]
    }
}