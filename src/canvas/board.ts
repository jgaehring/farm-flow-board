import { clone, mergeDeepRight, reduce } from 'ramda';
import type { ActionRecords, ActionType, LocationRecord } from '@/data/boardSampleData';
import { sameDate } from '@/utils/date';
import getCssVar from '@/utils/getCssVar';

type CanvasContext = CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;

interface Coordinates { x: number, y: number }
interface BoxCoordinates { origin: Coordinates, terminus: Coordinates }
interface BoxSize { width: number, height: number }
type BoxProperties = BoxCoordinates & BoxSize;

interface MarkerStyles {
  shadowColor: string,
  shadowBlur: number,
  shadowOffsetY: number,
  shadowOffsetX: number,
}

interface GridStyles {
  fill: string,
  stroke: string,
  lineWidth: number,
}
interface GridProperties extends BoxProperties, GridStyles {
  columns: number,
  rows: number,
  unit: number,
  markers: MarkerStyles,
}

interface LabelProperties<V> extends BoxProperties {
  values: V[],
  color: string,
  fontFamily: string,
}
interface BoardLabels<XData, YData> {
  x: LabelProperties<XData>,
  y: LabelProperties<YData>,
}
interface BoardProperties {
  width: number,
  height: number,
  labels: BoardLabels<Date, LocationRecord>,
  grid: GridProperties,
  highlight: GridStyles,
  index: { x: number, y: number },
  style: {
    fill: string,
    stroke: string,
  },
}
interface RangeConfig<XData, YData> {
  x: XData[],
  y: YData[],
}
interface GridOptions {
  unit?: number,
  yAxisWidth?: number,
  xAxisHeight?: number,
  lineWidth?: number,
  fill?: string,
  stroke?: string,
}
interface FontOptions {
  color?: string,
  fontFamily?: string,
}
interface LabelOptions {
  yAxisWidth?: number,
  xAxisHeight?: number,
  font?: FontOptions,
}
interface HighlightOptions {
  fill?: string,
  stroke?: string,
  lineWidth?: number,
}
interface StyleOptions {
  fill?: string,
  stroke?: string,
  grid?: GridOptions,
  highlight?: HighlightOptions,
  labels?: LabelOptions,
  markers?: {
    shadowColor?: string,
    shadowBlur?: number,
    shadowOffsetY?: number,
    shadowOffsetX?: number,
  },
}

interface StyleProperties {
  fill: string,
  stroke: string,
  font: {
    color: string,
    fontFamily: string,
  }
  grid: {
    unit: number,
    yAxisWidth: number,
    xAxisHeight: number,
    lineWidth: number,
    fill: string,
    stroke: string,
  },
  highlight: GridStyles,
  labels: {
    yAxisWidth: number,
    xAxisHeight: number,
  },
  markers: MarkerStyles,
}

// Based on the length of one of the canvas axes, the margins along that axis,
// and an array of elements to display, this function returns a truncated
// shallow copy of the elements that will fit within the canvas along that axis.
function fitToGrid<T>(
  axisLength: number,
  offset: number,
  elements: T[],
  unit: number,
  index?: number,
): T[] {
  const gridLength = axisLength - offset;
  const gridElements = Math.floor(gridLength / unit);
  let startIndex = typeof index === 'number' ? Math.max(index, 0) : 0;
  let stopIndex = startIndex + gridElements;
  if (stopIndex >= elements.length) {
    startIndex = Math.max(elements.length - gridElements, 0);
    stopIndex = elements.length;
  }
  const truncatedElements = elements.slice(startIndex, stopIndex);
  return truncatedElements;
}

function lightDark<L, D>(light: L, dark: D): L|D {
  const mQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mQuery.matches ? dark : light;
}

// Fallbacks for Style Options
const applyStyleFallbacks = (style: StyleOptions): StyleProperties => mergeDeepRight({
  fill: getCssVar('--color-background') || lightDark('#ffffff', '#181818'),
  stroke: getCssVar('--ff-c-green-transparent') || 'rgba(0, 189, 126, 0.3)',
  font: {
    color: getCssVar('--color-text') || lightDark('#2c3e50', '#ffffff'),
    fontFamily: getCssVar('--ff-font-family')
      || `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, `
      + `Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  },
  labels: {
    yAxisWidth: 240,
    xAxisHeight: 60,
  },
  grid: {
    unit: 40,
    yAxisWidth: 240,
    xAxisHeight: 60,
    lineWidth: 1.5,
    fill: getCssVar('--color-background-soft') || lightDark('#f8f8f8', '#222222'),
    stroke: getCssVar('--ff-c-green-transparent') || 'rgba(0, 189, 126, 0.3)',
  },
  highlight: {
    fill: getCssVar('--color-background-mute') || lightDark('#f2f2f2','#282828'),
    stroke: getCssVar('--ff-c-green-transparent') || 'rgba(0, 189, 126, 0.3)',
    lineWidth: 1.5,
  },
  markers: {
    shadowColor: lightDark('rgba(84, 84, 84, 0.24)', 'rgba(60, 60, 60, 0.29)'),
    shadowBlur: 3,
    shadowOffsetY: 1.5,
    shadowOffsetX: -3,
  },
}, style);

// Compute the board's dimensions and the range of values that can be displayed.
// Adjust the width and height to fit as many columns and rows as possible
// within the board's bounding box (ie, canvas + margins) w/o partially cutting
// off any columns or rows; the last column/row should be fully displayed.
export function computeBoardProperties(
  canvas: { width: number, height: number },
  range: RangeConfig<Date, LocationRecord>,
  index: { x: number, y: number },
  style?: StyleOptions,
): BoardProperties {
  const sureStyle = applyStyleFallbacks(style || {});
  const { labels: { yAxisWidth, xAxisHeight }, grid, highlight, markers, } = sureStyle;
  const dates = fitToGrid(
    canvas.width,
    yAxisWidth,
    range.x,
    grid.unit,
    index.x,
  );
  const locations = fitToGrid(
    canvas.height,
    xAxisHeight,
    range.y,
    grid.unit,
    index.y,
  );
  const columns = dates.length;
  const rows = locations.length;
  const gridWidth = columns * grid.unit;
  const gridHeight = rows * grid.unit;
  const boardWidth = yAxisWidth + gridWidth;
  const boardHeight = xAxisHeight + gridHeight;
  const labels: BoardLabels<Date, LocationRecord> = {
    x: {
      origin: { x: yAxisWidth, y: 0 },
      terminus: { x: boardWidth, y: xAxisHeight },
      width: gridWidth,
      height: xAxisHeight,
      values: dates,
      color: sureStyle.font.color,
      fontFamily: sureStyle.font.fontFamily,
    },
    y: {
      origin: { x: 0, y: xAxisHeight },
      terminus: { x: yAxisWidth, y: boardHeight },
      width: yAxisWidth,
      height: gridHeight,
      values: locations,
      color: sureStyle.font.color,
      fontFamily: sureStyle.font.fontFamily,
    },
  }
  return {
    width: boardWidth,
    height: boardHeight,
    grid: {
      width: gridWidth,
      height: gridHeight,
      unit: grid.unit,
      origin: { x: yAxisWidth, y: xAxisHeight },
      terminus: { x: boardWidth, y: boardHeight },
      rows,
      columns,
      lineWidth: grid.lineWidth,
      fill: grid.fill,
      stroke: grid.stroke,
      markers,
    },
    highlight,
    labels,
    index,
    style: {
      fill: sureStyle.fill,
      stroke: sureStyle.stroke,
    },
  };
}

// Draw Farm Flow's main board.
export function drawBoard(
  ctx: CanvasContext,
  range: RangeConfig<Date, LocationRecord>,
  actionRecords: ActionRecords,
  index: { x: number, y: number },
  style: StyleOptions,
): BoardProperties {
  const board = computeBoardProperties(ctx.canvas, range, index, style);
  const { labels, grid } = board;
  // Clear the canvas & apply a fill so previous paints don't show through.
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = board.style.fill;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawGrid(ctx, grid);
  labelAxisX(ctx, grid, labels.x);
  labelAxisY(ctx, grid, labels.y);
  plotActions(ctx, board, actionRecords);
  return board;
}

/**
 * easeInOutQuad: Quadratic easing function for both entering and exiting.
 * @param x Absolute progress ratio from 0 (start) to 1 (end). In the case of an
 * animation, x would be the time variable, advancing linearly from the time it
 * begins to when it ends.
 * @returns Eased progress ratio from 0 (start) to 1 (end). In the case of an
 * animation, the return value would be the distance traveled expressed as a
 * fraction of the total distance it will travel.
 * @link https://easings.net/en#easeInOutQuad
 */
function easeInOutQuad(x: number): number {
  const y = x < 0.5
    ? 2 * x * x 
    : 1 - Math.pow(-2 * x + 2, 2) / 2;
  return y;
}

type translationAllCallback = (
  ctx: CanvasContext,
  board: BoardProperties,
  deltas: BoxSize & Coordinates,
) => void;
type translationEachCallback = (
  ctx: CanvasContext,
  board: BoardProperties,
  deltas: BoxSize & Coordinates,
  interval: {
    translateX: number, translateY: number,
    timestamp: DOMHighResTimeStamp,
    progress: number, easing: number,
  },
) => void;
interface TranslationParameters {
  to: { x: number, y: number },
  from: { x: number, y: number },
  duration?: number,
  afterAll?: translationAllCallback,
  afterEach?: translationEachCallback,
  beforeAll?: translationAllCallback,
  beforeEach?: translationEachCallback,
}

export function translateBoard(
  ctx: CanvasContext,
  range: RangeConfig<Date, LocationRecord>,
  actionRecords: ActionRecords,
  translation: TranslationParameters,
  style: StyleOptions,
) {
  // The board properties for the translation's starting and ending points.
  const fromBoard = computeBoardProperties(ctx.canvas, range, translation.from, style);

  // Compute the offscreen canvas's board dimensions, which will be larger than
  // the main canvas b/c it must include all gridpoints from the translation's
  // starting to its ending position. The deltas of the x and y coordinates of
  // the index will indicate the direction and magnitude of that change...
  const dX = translation.to.x - translation.from.x;
  const dY = translation.to.y - translation.from.y;
  // ...meanwhilethe width and height deltas will indicate, in absolute terms,
  // just how much larger the offscreen canvas is compared to the main canvas.
  const deltas = {
    x: dX, y: dY,
    width: dX * fromBoard.grid.unit,
    height: dY * fromBoard.grid.unit,
  };
  const canvasDeltas = {
    width: ctx.canvas.width + Math.abs(deltas.width),
    height: ctx.canvas.height + Math.abs(deltas.height),
  };
  // Positive (+1), if dX or dY is positive. Negatative (-1) if it's negative.
  const signOfDx = dX !== 0 ? dX / Math.abs(dX) : 1;
  const signOfDy = dY !== 0 ? dY / Math.abs(dY) : 1;
  // The index will always be the lowest x and y values displayed, whether the
  // translation is going from highest to lowest, or vice versa. 
  const index = {
    x: Math.min(translation.to.x, translation.from.x),
    y: Math.min(translation.to.y, translation.from.y),
  };
  // The properties of the board rendered while animating the translation.
  const transBoard = computeBoardProperties(canvasDeltas, range, index, style);

  // Invoke the beforeAll() callback now that the deltas and board dimensions
  // have been calculated, but before the animation starts.
  if (typeof translation.beforeAll === 'function') {
    translation.beforeAll(ctx, transBoard, deltas);
  }

  let frame = 0;
  let starttime: DOMHighResTimeStamp = 0;
  const durationTotal = translation.duration || 512;
  function animate(timestamp: DOMHighResTimeStamp) {
    // Set the starttime if needed and calculate how much time has passed.
    if (starttime === 0) starttime = timestamp;
    const durationCurrent = timestamp - starttime;
    // Calculate the absolute progress ratio and the easing progress ratio.
    const progress = durationCurrent / durationTotal;
    const easing = easeInOutQuad(progress);
    // Easing for the x + y axes' translation origins specifically, the
    // translateX & translateY respectively, will differ whether the dX or dY
    // is positive or negative. If dY or dY is POSITIVE, it will represent the
    // progress so far, or in other words, the SUM of 0 + easing; if NEGATIVE,
    // it will represent the portion of the translation delta that yet remains,
    // that is, the DIFFERENCE of 1 - easing.
    const easingX = ((signOfDx - 1) / 2 + easing);
    const easingY = ((signOfDy - 1) / 2 + easing);

    // Mutable variable for determining the translation & clipping coordinates.
    let translateX = 0;
    let translateY = 0;
    let { width: clipW, height: clipH } = fromBoard.grid;
    const {
      origin: clipOrigin, terminus: clipTerminus,
    } = clone(fromBoard.grid);

    // If the board is translating along the X-AXIS, adjust the x-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the X-AXIS labels, so they will be translated too.
    if (dX !== 0) {
      translateX = translateX - easingX * deltas.width;
      clipH = fromBoard.height;
      clipOrigin.y = 0;
    }

    // If the board is translating along the Y-AXIS, adjust the y-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the Y-AXIS labels, so they will be translated too.
    if (dY !== 0) {
      translateY = translateY - easingY * deltas.height;
      clipW = fromBoard.width;
      clipOrigin.x = 0;
    }

  // Invoke the beforeEach() callback now that the translation coordinates and
  // easing have been calculated, but before clipping, translating, and drawing.
  if (typeof translation.beforeEach === 'function') {
      const cycle = { translateX, translateY, timestamp, progress, easing };
      translation.beforeEach(ctx, transBoard, deltas, cycle);
    }

    // Apply a background fill, b/c most of each fill is transparent and so
    // the gridlines and text will get smeared out otherwise.
    ctx.fillStyle = fromBoard.style.fill;
    ctx.fillRect(clipOrigin.x, clipOrigin.y, clipW, clipH);
    // Then save the context prior to clipping and translating.
    ctx.save();

    // Apply a clipping mask to the grid plus whichever label(s) may have moved.
    ctx.beginPath();
    ctx.moveTo(clipOrigin.x, clipOrigin.y);
    ctx.lineTo(clipTerminus.x, clipOrigin.y);
    ctx.lineTo(clipTerminus.x, clipTerminus.y);
    ctx.lineTo(clipOrigin.x, clipTerminus.y);
    ctx.clip();

    // Translate the board context accounting for the amount the grid has moved
    // along the x and/or y axes, as well as eased progress of the animation,
    // which has already been factored into the translation coordinates.
    ctx.translate(translateX, translateY);
    if (dX !== 0) labelAxisX(ctx, transBoard.grid, transBoard.labels.x);
    if (dY !== 0) labelAxisY(ctx, transBoard.grid, transBoard.labels.y);
    drawGrid(ctx, transBoard.grid);
    plotActions(ctx, transBoard, actionRecords);

    // Restore the context to its prior state prior before the clipping and
    // translating operations, then just to be safe, transform the context back
    // to identity matrix while we're at it too.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();

    if (progress < 1) {
    // If the animation hasn't finished, call afterEach() and resume the loop.
      if (typeof translation.afterEach === 'function') {
        const cycle = { translateX, translateY, timestamp, progress, easing };
        translation.afterEach(ctx, transBoard, deltas, cycle);
      }
      frame = window.requestAnimationFrame(animate);
    } else {
    // Otherwise run the necessary cleanup, render the board at its final
    // coordinates, and invoke the afterAll() translation callback.
      window.cancelAnimationFrame(frame);
      ctx.restore();
      drawBoard(ctx, range, actionRecords, translation.to, style);
      if (typeof translation.afterAll === 'function') {
        translation.afterAll(ctx, transBoard, deltas);
      }
    }
  }

  // Initialize the animation loop.
  frame = window.requestAnimationFrame(animate);
}

function drawGrid(
  ctx: CanvasContext,
  grid: GridProperties,
) {
  // The x + y coordinates where each line will start (origin) & end (terminus).
  const {
    origin: { x: originX, y: originY },
    terminus: { x: terminusX, y: terminusY },
  } = grid;
  // Before drawing, always save the context's state.
  ctx.save();

  // Draw the grid's background & gridlines.
  ctx.fillStyle = grid.fill;
  ctx.fillRect(originX, originY, grid.width, grid.height);
  ctx.strokeStyle = grid.stroke;
  const outlineWidth = grid.lineWidth / 2;
  ctx.lineWidth = outlineWidth;
  ctx.strokeRect(
    originX - outlineWidth / 2,
    originY - outlineWidth / 2,
    grid.width + outlineWidth,
    grid.height + outlineWidth,
  );
  ctx.lineWidth = grid.lineWidth;

  // First loop through the horizontal gridlines...
  for (
    // ...starting from the top...
    let y = originY + grid.unit;
    // ...ending at the bottom...
    y < terminusY;
    // ...iterating through each line, spaced accordingly by grid units.
    y += grid.unit
  ) {
    ctx.beginPath();
    // Horizontal gridlines will have endpoints on the x-origin & x-terminus.
    ctx.moveTo(originX, y);
    ctx.lineTo(terminusX, y);
    ctx.stroke();
  }

  // Then the vertical gridlines...
  for (
    // ...starting from the left...
    let x = originX + grid.unit;
    // ...ending at the right...
    x < terminusX;
    // ...iterating through by grid units.
    x += grid.unit
  ) {
    ctx.beginPath();
    // Vertical gridlines will have endpoints on the y-origin & y-terminus.
    ctx.moveTo(x, originY);
    ctx.lineTo(x, terminusY);
    ctx.stroke();
  }
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

// Month format for the x-axis labels.
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' });
// Reducer function derives the x-axis grid coordinates covered by each month.
const reduceDatesToMonths = reduce((
  months: Array<{ name: string, startCol: number, endCol: number }>,
  d: Date,
) => {
  const name = monthFmt.format(d);
  const prev = months[months.length - 1];
  if (!prev || prev.name !== name) {
    const startCol = prev?.endCol || 0;
    return [...months, { name, startCol, endCol: startCol + 1 }];
  }
  const endCol = prev.endCol + 1;
  return [
    ...months.slice(0, months.length - 1),
    { ...prev, endCol }
  ];
}, []);

function labelAxisX(
  ctx: CanvasContext,
  grid: GridProperties,
  label: LabelProperties<Date>,
) {
  // Label the x-axis with the date numeral directly above each column.
  const dateLineheight = Math.floor(label.height * (5 / 9));
  const dateFontSize = Math.floor(dateLineheight * (5 / 9));
  const dateBaseline = label.height - Math.floor(dateLineheight * (1 / 3));
  const dateTextMarginLeft = grid.unit * .5;
  const { origin, values: dates } = label;
  // Before drawing, always save the context's state.
  ctx.save();
  dates.forEach((d, i) => {
    const text = d.getDate().toString();
    const x = origin.x + i * grid.unit + dateTextMarginLeft;
    ctx.fillStyle = label.color;
    ctx.font = `${dateFontSize}px ${label.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, dateBaseline);
  });
  // Draw a bounding box around both month and date labels.
  ctx.strokeStyle = grid.stroke;
  ctx.strokeRect(origin.x, 0, dates.length * grid.unit, label.height);

  // Add the months across the top, spread out over the date numerals.
  const months = reduceDatesToMonths(dates);
  const monthLineheight = Math.floor(label.height * (3 / 9));
  const monthFontSize = Math.floor(monthLineheight * (2 / 3));
  const monthBaseline = monthLineheight - Math.floor(monthLineheight * (1 / 5));
  // Draw a horizontal rule between months and dates.
  ctx.beginPath();
  ctx.moveTo(origin.x, monthLineheight);
  ctx.lineTo(origin.x + dates.length * grid.unit, monthLineheight);
  ctx.stroke();
  months.forEach((month, i) => {
    const width = (month.endCol - month.startCol) * grid.unit;
    const bgX = origin.x + month.startCol * grid.unit;
    // Unless it's the first month, draw a vertical line as its left border to
    // separate it from the previous month, stopping at the top of the grid.
    if (i !== 0) {
      ctx.beginPath();
      ctx.moveTo(bgX, 0);
      ctx.lineTo(bgX, label.height);
      ctx.stroke();
    }
    const textX = bgX + .5 * width;
    ctx.fillStyle = label.color;
    ctx.font = `${monthFontSize}px ${label.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(month.name, textX, monthBaseline);
  });
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

function labelAxisY(
  ctx: CanvasContext,
  grid: GridProperties,
  label: LabelProperties<LocationRecord>,
) {
  // Before drawing, always save the context's state.
  ctx.save();
  const { origin, values: locations } = label;
  ctx.fillStyle = label.color;
  ctx.font = `${grid.unit * .65}px ${label.fontFamily}`;
  ctx.textAlign = 'end';
  const x = label.width - 6;
  locations.forEach((loc, i) => {
    const y = origin.y + (i + 1) * grid.unit - grid.unit * .25;
    ctx.fillText(loc.name, x, y);
  });
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

function plotActions (
  ctx: CanvasContext,
  board: BoardProperties,
  actionRecords: ActionRecords,
) {
  const { grid, labels: { x, y } } = board;
  y.values.forEach((location, indexY) => {
    plotActionsByLocation(ctx, grid, x.values, actionRecords, location, indexY);
  });
}

function plotActionsByLocation(
  ctx: CanvasContext,
  grid: GridProperties,
  dateSeq: Date[],
  actionRecords: ActionRecords,
  location: LocationRecord,
  indexY: number,
) {
  const records = actionRecords.find(loc => loc.id === location.id)?.dates || [];
  dateSeq.forEach((date, indexX) => {
    const rec = records.find(r => sameDate(r.date, date));
    if (rec) plotActionsByDate(ctx, grid, rec.actions, indexX, indexY);
  });
}

export type HighlightGenerator = Generator<void, void, [number, number, number?, number?]>;
export function* addHighlighter(
  ctx: CanvasContext,
  range: RangeConfig<Date, LocationRecord>,
  actionRecords: ActionRecords,
  origin: { x: number, y: number },
  style?: StyleOptions,
): Generator<void, void, [number, number, number?, number?]> {
  const board = computeBoardProperties(ctx.canvas, range, origin, style);
  const { grid, labels } = board;
  const gridHL = { ...grid, ...board.highlight };
  function refresh(vector: [[curX: number, curY: number], [prevX: number, prevY: number]]): void {
    const [position, prevPosition] = vector;
    const curX = Math.floor((position[0] - labels.y.width) / grid.unit);
    const prevX = Math.floor((prevPosition[0] - labels.y.width) / grid.unit);
    const curY = Math.floor((position[1] - labels.x.height) / grid.unit);
    const prevY = Math.floor((prevPosition[1] - labels.x.height) / grid.unit);

    if (curX !== prevX || curY !== prevY) {
      const { x: { values: dateLabels } } = labels;
      const { y: { values: locLabels } } = labels;

      // A list of tuples for the rows and columns which must be repainted,
      // containing the x or y coordinate for columns or rows, respectively, and
      // the grid properties to use to paint it, with highlight styles for the
      // current row/col, and base styles for repainting the previous.
      type RowsAndColumns = [x: number|null, y: number|null, g: GridProperties][];
      const rowsAndCols: RowsAndColumns = [
        [prevX, null, grid],
        [null, prevY, grid],
        [curX, null, gridHL],
        [null, curY, gridHL],
      ];
      // Redraw the grid backgrounds for the previous column & row first,
      // restoring the default colors, before the currently highlighted col/row.
      // Doing both before plotting any actions requires looping through the
      // dates and locations many more times, but prevents the previous cells
      // from painting over any newly highlighted cells.
      rowsAndCols.forEach(([x, y, g]) => {
        if (x && dateLabels[x]) locLabels.forEach((_, i) => drawCellGrid(ctx, g, x, i));
        if (y && locLabels[y]) dateLabels.forEach((_, i) => drawCellGrid(ctx, g, i, y));
      });

      // Compute the column immediately in front of the current col (lookahead)
      // and the one behind the previous (lookbehind).
      const directionX = curX - prevX
      const lookaheadX = curX + directionX
      const lookbehindX = prevX - directionX

      // Don't use shadows to repaint the actions in the lookahead/lookbehind
      // columns, because their grid cell's background is not being repainted,
      // and the shadows are transparent and will darken cumulatively.
      const markerStyles = {
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      };
      const gridLALB: GridProperties = { ...grid, markers: markerStyles };

      // Add lookahead and lookbehind to the start of the list before plotting
      // the actions again. This will prevent any overflowing markers for dates
      // with multiple actionsfrom being painted over.
      const rowsAndColsPlusLookaheads: RowsAndColumns = [
        [lookaheadX, null, gridLALB],
        [lookbehindX, null, gridLALB],
        ...rowsAndCols,
      ];
      // Re-plot the actions in the effected rows/cols.
      rowsAndColsPlusLookaheads.forEach(([x, y, g]) => {
        // COLUMNS.
        if (typeof x === 'number') {
          const columnDate = dateLabels[x];
          locLabels.forEach((eachLoc, iOfY) => {
            const records = actionRecords.find(l => l.id === eachLoc.id)?.dates || [];
            const rec = records.find(r => sameDate(r.date, columnDate));
            if (rec) plotActionsByDate(ctx, g, rec.actions, x, iOfY);
          })
        }
        // ROWS.
        if (typeof y === 'number') {
          const rowLocation = locLabels[y];
          const records = actionRecords.find(l => l.id === rowLocation?.id)?.dates || [];
          dateLabels.forEach((eachDate, iOfX) => {
            const rec = records.find(r => sameDate(r.date, eachDate));
            if (rec) plotActionsByDate(ctx, g, rec.actions, iOfX, y);
          });
        }
      });
    }
  }
  const previous = [-1, -1];
  while (true) {
    let [prevX, prevY] = previous;
    const position = yield;
    const [x, y, ...prev] = position;
    if (typeof prev[0] === 'number' && typeof prev[1] === 'number') {
      prevX = prev[0];
      prevY = prev[1];
    }
    previous[x] = x;
    previous[y] = y;
    refresh([[x, y], [prevX, prevY]]);
  }

}

function plotActionsByDate(
  ctx: CanvasContext,
  grid: GridProperties,
  actions: ActionType[],
  indexX: number,
  indexY: number,
) {
  ctx.save(); // Before drawing, always save the context state.

  // Derive the coordinates & dimensions for the circular marker.
  const centerX = grid.origin.x + (indexX + .5) * grid.unit;
  const centerY = grid.origin.y + (indexY + .5) * grid.unit;
  const radius = grid.unit * (11 / 30);
  const startAngle = 0;
  const endAngle = 2 * Math.PI;

  // Multiple actions on the same date must be staggered horizontally, so use
  // two tenths of the grid unit as the gap between each marker. Then calculate
  // the length from the left edge of the leftmost marker to the right edge of
  // the rightmost marker. It should be the diameter of just one marker, plus
  // the combined lenth of all gaps, w/ one less gap than there are markers.
  const gapCount = actions.length - 1;
  const gapSize = grid.unit * .2;
  const totalLength = 2 * radius + gapCount * gapSize;

  actions.forEach((a, i) => {
    // If the marker's index, i, is less than half the number of total actions,
    // it will be offset by a negative distance from center of the grid, if more
    // than half of actions.length it will be a positive value, and if exactly
    // half it will be zero.
    const offsetX = radius + i * gapSize - totalLength / 2;

    // Now draw the circle for the marker.
    ctx.fillStyle = a.color || 'tomato';
    ctx.beginPath();
    ctx.arc(centerX + offsetX, centerY, radius, startAngle, endAngle);

    // Apply a shadow to every marker.
    ctx.shadowColor = grid.markers.shadowColor;
    ctx.shadowBlur = grid.markers.shadowBlur;
    ctx.shadowOffsetX = grid.markers.shadowOffsetX;
    ctx.shadowOffsetY = grid.markers.shadowOffsetY;
    ctx.fill();

    // Reset shadow to default values.
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });

  ctx.restore(); // Now that drawing has finished, restore the context state.
}

// Draw the background & gridlines for a single grid cell.
function drawCellGrid(
  ctx: CanvasContext,
  grid: GridProperties,
  indexX: number,
  indexY: number,
) {
  const originX = grid.origin.x + (indexX) * grid.unit;
  const originY = grid.origin.y + (indexY) * grid.unit;
  ctx.clearRect(originX, originY, grid.unit, grid.unit);
  const innerLineW = grid.lineWidth / 2;
  ctx.lineWidth = innerLineW;
  ctx.fillStyle = grid.fill;
  ctx.fillRect(originX - innerLineW, originY - innerLineW, grid.unit, grid.unit);
  ctx.strokeStyle = grid.stroke;
  ctx.strokeRect(originX - innerLineW / 2, originY - innerLineW / 2, grid.unit, grid.unit);
}
