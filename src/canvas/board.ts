import { clone, reduce } from 'ramda';
import useStyleDeclaration from '@/composables/useStyleDeclaration';
import type { ActionRecords, LocationRecord } from '@/views/boardSampleData';

// Get custom CSS properties (aka, variables) from stylesheet.
const rootStyles = useStyleDeclaration(':root');
const getCssVar = (v: string, def?: string) =>
  rootStyles.value?.getPropertyValue(v) || def || 'inherit';

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
  let startIndex = index || 0;
  let stopIndex = startIndex + gridElements;
  if (stopIndex >= elements.length) {
    startIndex = elements.length - gridElements;
    stopIndex = elements.length;
  }
  const truncatedElements = elements.slice(startIndex, stopIndex);
  return truncatedElements;
}

interface BoxCoordinates {
  origin: { x: number, y: number },
  terminus: { x: number, y: number },
}
interface BoxProperties {
  coords: BoxCoordinates,
  width: number,
  height: number,
}
interface GridProperties extends BoxProperties {
  unit: number,
  fill?: string,
  stroke?: string,
  lineWidth?: number,
}
interface LabelProperties<Data> extends BoxProperties {
  data: Data[],
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
  index: { x: number, y: number },
}
interface RangeConfig<XData, YData> {
  x: XData[],
  y: YData[],
}
interface GridConfig {
  unit: number,
  lineWidth: number,
  yAxisWidth: number,
  xAxisHeight: number,
}

// Compute the board's dimensions and the range of values that can be displayed.
// Adjust the width and height to fit as many columns and rows as possible
// within the board's bounding box (ie, canvas + margins) w/o partially cutting
// off any columns or rows; the last column/row should be fully displayed.
function computeBoardProperties(
  canvas: { width: number, height: number },
  range: RangeConfig<Date, LocationRecord>,
  grid: GridConfig,
  index: { x: number, y: number },
): BoardProperties {
  const { unit, lineWidth } = grid;
  const { yAxisWidth, xAxisHeight } = grid;
  // const xOffset = grid.labels.yAxisWidth;
  // const yOffset = grid.labels.xAxisHeight;
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
  const gridWidth = columns * unit;
  const gridHeight = rows * unit;
  const boardWidth = yAxisWidth + gridWidth;
  const boardHeight = xAxisHeight + gridHeight;
  const labels: BoardLabels<Date, LocationRecord> = {
    x: {
      coords: {
        origin: { x: yAxisWidth, y: 0 },
        terminus: { x: boardWidth, y: xAxisHeight },
      },
      width: gridWidth,
      height: xAxisHeight,
      data: dates,
    },
    y: {
      coords: {
        origin: { x: 0, y: xAxisHeight },
        terminus: { x: yAxisWidth, y: boardHeight },
      },
      width: yAxisWidth,
      height: gridHeight,
      data: locations,
    },
  }
  return {
    width: boardWidth,
    height: boardHeight,
    grid: { 
      width: gridWidth,
      height: gridHeight,
      coords: {
        origin: { x: yAxisWidth, y: xAxisHeight },
        terminus: { x: boardWidth, y: boardHeight },
      },
      unit,
      lineWidth,
    },
    labels,
    index,
  };
}

// Draw Farm Flow's main board.
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  range: RangeConfig<Date, LocationRecord>,
  gridConfig: GridConfig,
  actionRecords: ActionRecords,
  index: { x: number, y: number },
): BoardProperties {
  const board = computeBoardProperties(ctx.canvas, range, gridConfig, index);
  const { width, height, labels, grid } = board;
  ctx.clearRect(0, 0, width, height);
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

interface TranslationParameters {
  to: { x: number, y: number },
  from: { x: number, y: number },
  afterAll?: (ctx: CanvasRenderingContext2D) => void,
  afterEach?: (ctx: CanvasRenderingContext2D) => void,
  beforeAll?: (ctx: CanvasRenderingContext2D) => void,
  beforeEach?: (ctx: CanvasRenderingContext2D) => void,
}

export function translateBoard(
  ctx: CanvasRenderingContext2D,
  range: RangeConfig<Date, LocationRecord>,
  gridConfig: GridConfig,
  actionRecords: ActionRecords,
  translation: TranslationParameters,
) {
  // The board properties for the translation's starting and ending points.
  const fromBoard = computeBoardProperties(ctx.canvas, range, gridConfig, translation.from);

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
    width: ctx.canvas.width + dX * gridConfig.unit,
    height: ctx.canvas.height + dY * gridConfig.unit,
  };
  // The index will always be the lowest x and y values displayed, whether the
  // translation is going from highest to lowest, or vice versa. 
  const index = {
    x: Math.min(translation.to.x, translation.from.x),
    y: Math.min(translation.to.y, translation.from.y),
  };
  // The properties of the board rendered offscreen to animate the translation.
  const offscrBoard = computeBoardProperties(deltas, range, gridConfig, index);

  if (typeof translation.beforeAll === 'function') translation.beforeAll(ctx);

  let frame = 0;
  let starttime: DOMHighResTimeStamp = 0;
  const durationTotal = 1024;
  function animate(ts: DOMHighResTimeStamp) {
    // Set the starttime if needed and calculate how much time has passed.
    if (starttime === 0) starttime = ts;
    const durationCurrent = ts - starttime;
    // Calculate the absolute progress ratio and the easing progress ratio.
    const progress = durationCurrent / durationTotal;
    const easing = easeInOutQuad(progress);

    // Mutable variable for determining the translation & clipping coordinates.
    let translateX = 0;
    let translateY = 0;
    let { width: clipW, height: clipH } = fromBoard.grid;
    const {
      origin: clipOrigin, terminus: clipTerminus,
    } = clone(fromBoard.grid.coords);

    // If the board is translating along the X-AXIS, adjust the x-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the X-AXIS labels, so they will be translated too.
    if (dX !== 0) {
      translateX -= easing * dX * gridConfig.unit;
      clipH = fromBoard.height;
      clipOrigin.y = 0;
    }

    // If the board is translating along the Y-AXIS, adjust the y-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the Y-AXIS labels, so they will be translated too.
    if (dY !== 0) {
      translateY -= easing * dY * gridConfig.unit;
      clipW = fromBoard.width;
      clipOrigin.x = 0;
    }

    //
    if (typeof translation.beforeEach === 'function') {
      translation.beforeEach(ctx);
    }

    // Apply a background fill, b/c most of each fill is transparent and so
    // the gridlines and text will get smeared out otherwise.
    ctx.fillStyle = getCssVar('--color-background');
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
    if (dX !== 0) labelAxisX(ctx, offscrBoard.grid, offscrBoard.labels.x);
    if (dY !== 0) labelAxisY(ctx, offscrBoard.grid, offscrBoard.labels.y);
    drawGrid(ctx, offscrBoard.grid);
    plotActions(ctx, offscrBoard, actionRecords);

    // Restore the context to its prior state prior before the clipping and
    // translating operations, then just to be safe, transform the context back
    // to identity matrix while we're at it too.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();

    if (progress < 1) {
    // If the animation hasn't finished, call afterEach() and resume the loop.
      if (typeof translation.afterEach === 'function') translation.afterEach(ctx);
      frame = window.requestAnimationFrame(animate);
    } else {
    // Otherwise run the necessary cleanup, render the board at its final
    // coordinates, and invoke the afterAll() translation callback.
      window.cancelAnimationFrame(frame);
      ctx.restore();
      drawBoard(ctx, range, gridConfig, actionRecords, translation.to);
      if (typeof translation.afterAll === 'function') translation.afterAll(ctx);
    }
  }

  // Initialize the animation loop.
  frame = window.requestAnimationFrame(animate);
}

function drawGrid(
  ctx: CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D,
  grid: GridProperties,
) {
  // The x + y coordinates where each line will start (origin) & end (terminus).
  const {
    origin: { x: originX, y: originY },
    terminus: { x: terminusX, y: terminusY },
  } = grid.coords;

  // Draw the grid's background.
  ctx.fillStyle = grid.fill || getCssVar('--color-background-mute', 'light-dark(#fafafa, #222222)');
  ctx.lineWidth = grid.lineWidth || 1.5;
  ctx.fillRect(originX, originY, grid.width, grid.height);

  // Default to green transparent gridlines.
  ctx.strokeStyle = grid.stroke || getCssVar('--ff-c-green-transparent', 'rgba(0, 189, 126, 0.3)');

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
  ctx: CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D,
  grid: GridProperties,
  label: LabelProperties<Date>,
) {
  // Label the x-axis with the date numeral directly above each column.
  const dateLineheight = Math.floor(label.height * (5 / 9));
  const dateFontSize = Math.floor(dateLineheight * (5 / 9));
  const dateBaseline = label.height - Math.floor(dateLineheight * (1 / 3));
  const dateTextMarginLeft = grid.unit * .5;
  const { coords: { origin }, data: dates } = label;
  dates.forEach((d, i) => {
    const label = d.getDate().toString();
    const x = origin.x + i * grid.unit + dateTextMarginLeft;
    ctx.fillStyle = getCssVar('--color-text');
    ctx.font = `${dateFontSize}px ${getCssVar('--ff-font-family')}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, dateBaseline);
  });
  // Draw a bounding box around both month and date labels.
  ctx.strokeStyle = grid.stroke || getCssVar('--ff-c-green-transparent');
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
    ctx.fillStyle = getCssVar('--color-text');
    ctx.font = `${monthFontSize}px ${getCssVar('--ff-font-family')}`;
    ctx.textAlign = 'center';
    ctx.fillText(month.name, textX, monthBaseline);
  });
}

function labelAxisY(
  ctx: CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D,
  grid: GridProperties,
  label: LabelProperties<LocationRecord>,
) {
  const { coords: { origin }, data: locations } = label;
  ctx.fillStyle = getCssVar('--color-text');
  ctx.font = `${grid.unit * .65}px ${getCssVar('--ff-font-family')}`;
  ctx.textAlign = 'end';
  const x = label.width - 6;
  locations.forEach((loc, i) => {
    const y = origin.y + (i + 1) * grid.unit - grid.unit * .25;
    ctx.fillText(loc.name, x, y);
  });
}

function plotActions(
  ctx: CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D,
  board: BoardProperties,
  actionRecords: ActionRecords,
) {
  const { grid, labels } = board;
  const { y: { data: locations }, x: { data: dateRange } } = labels;
  const start = dateRange.slice(0, 1)[0].valueOf();
  const end = dateRange.slice(-1)[0].valueOf();
  locations.reduce((actions, loc) => {
    // Map the location to the actions records assigned to it, which are already
    // grouped by location, then filter the dates based on the current date
    // range. If no actions exist for that location or those dates, just provide
    // and empty array for the dates.
    const dates = actionRecords
      .find(aByLoc => aByLoc.id === loc.id)?.dates
      .filter((aByDate) => {
        const timestamp = aByDate.date.valueOf();
        const dateIsDisplayed = timestamp >= start && timestamp <= end;
        return dateIsDisplayed;
      }) || [];
    // Retain the location's name & id, then concat it to the list w/ the dates.
    const { id, name } = loc;
    return [...actions, { id, name, dates }];
  }, [] as ActionRecords).forEach((actionsByLoc, locIndex) => {
    actionsByLoc.dates.forEach(({ actions, date }) => {
      const timestamp = date.valueOf();
      const gridX = 1 + Math.floor((timestamp - start) / 24 / 60 / 60 / 1000);
      const gridY = locIndex + 1;
      const originX = grid.coords.origin.x + (gridX - .5) * grid.unit;
      const originY = grid.coords.origin.y + (gridY - .5) * grid.unit;
      const radius = grid.unit * (11 / 30);
      const startAngle = 0;
      const endAngle = 2 * Math.PI;
      ctx.shadowColor = '#181818';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.shadowOffsetX = -3;
      actions.forEach((a, i) => {
        const spaceBetweenDots = grid.unit * .2;
        const offsetX = (2 * i + 1 - actions.length) * (spaceBetweenDots / 2);
        ctx.fillStyle = a.color || 'tomato';
        ctx.beginPath();
        ctx.arc(originX + offsetX, originY, radius, startAngle, endAngle);
        ctx.fill();
      });
      ctx.shadowColor = '#181818';
      ctx.shadowBlur = 0;
      ctx.shadowBlur = 0;
    });
  });
}
