(function() { 'use strict';

  const HALF = Math.PI;
  const FULL = HALF * 2;
  const FOURTH = FULL / 4;
  const THREE_FOURTHS = FOURTH * 3;
  const THIRD = FULL / 3;
  const TWO_THIRDS = THIRD * 2;
  const SIXTH = THIRD / 2;
  const EIGHTH = FOURTH / 2;

  const EAST = 0;
  const SOUTH_EAST = EIGHTH;
  const SOUTH = FOURTH;
  const SOUTH_WEST = SOUTH + EIGHTH;
  const WEST = HALF;
  const NORTH_WEST = WEST + EIGHTH;
  const NORTH = THREE_FOURTHS;
  const NORTH_EAST = NORTH + EIGHTH;

  const draw = {
    HALF,
    FULL,
    FOURTH,
    THREE_FOURTHS,
    THIRD,
    TWO_THIRDS,
    SIXTH,
    EIGHTH,

    EAST,
    SOUTH_EAST,
    SOUTH,
    SOUTH_WEST,
    WEST,
    NORTH_WEST,
    NORTH,
    NORTH_EAST,

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} innerWidth
     * @param {number} innerHeight
     * @param {number[]} edges
     * @param neighbors
     */
    pathGridCell(ctx, x, y, innerWidth, innerHeight, edges, neighbors) {
      const [ top, right, bottom, left ] = edges;
      const [ hasTop, hasRight, hasBottom, hasLeft ] = neighbors;
      const width = innerWidth + left + right;
      const height = innerHeight + top + bottom;
      if (top) {
        ctx.rect(x, y, width, top);
      }
      if (right) {
        ctx.rect(x + width - right, y + top, right, innerHeight);
      }
      if (bottom) {
        ctx.rect(x, y + height - bottom, width, bottom);
      }
      if (left) {
        ctx.rect(x, y + top, left, innerHeight);
      }

      // const half = innerWidth / 2;
      // ctx.arc(x + half, y + half, half, NORTH, WEST);
    },
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} xPos
     * @param {number} yPos
     * @param {number} gridWidth
     * @param {number} gridHeight
     * @param {number} cellInnerWidth
     * @param {number} cellInnerHeight
     * @param {number|[number]|[number,number]|[number,number,number]} borders
     * @param {number} [thickInterval] (default: 5)
     */
    pathGrid(ctx, xPos, yPos, gridWidth, gridHeight, cellInnerWidth, cellInnerHeight, borders, thickInterval = 5) {
      let [ thin, thick, border ] = [].concat(borders || 1);
      if (!thick && thick !== 0) {
        thick = thin;
      }
      if (!border && border !== 0) {
        border = thin;
      }
      let ay = yPos;
      const { pathGridCell } = draw;
      for (let y = 0; y < gridHeight; ++y) {
        const top = !y ? border : !(y % thickInterval) ? thick : thin;
        const bottom = y === gridHeight - 1 ? border : 0;
        let ax = xPos;
        for (let x = 0; x < gridWidth; ++x) {
          const right = x === gridWidth - 1 ? border : 0;
          const left = !x ? border : !(x % thickInterval) ? thick : thin;
          pathGridCell(ctx, ax, ay, cellInnerWidth, cellInnerHeight, [top, right, bottom, left], [1, 1, 1, 1]);
          ax += left + cellInnerWidth + right;
        }
        ay += top + cellInnerHeight + bottom;
      }
    },
  };

  window.draw = draw;

})();
