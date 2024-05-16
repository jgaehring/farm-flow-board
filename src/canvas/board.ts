import { reduce } from 'ramda';
import useStyleDeclaration from '@/composables/useStyleDeclaration';
import type { ActionRecords, LocationRecord } from '@/views/boardSampleData';

// Get custom CSS properties (aka, variables) from stylesheet.
const rootStyles = useStyleDeclaration(':root');
const getCssVar = (v: string, def?: string) =>
  rootStyles.value?.getPropertyValue(v) || def || 'inherit';


interface GridProperties {
  width: number,
  height: number,
  unit: number,
  fill?: string,
  stroke?: string,
  lineWidth?: number,
}

interface BoardMargins {
  top: number,
  right: number,
  bottom: number,
  left: number,
}

interface BoardProperties {
  width: number,
  height: number,
  margin: BoardMargins,
  dates: Date[],
  locations: LocationRecord[],
  grid: GridProperties,
}

// Draw Farm Flow's main board.
export default function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardProperties,
  actionRecords: ActionRecords,
) {
  const { width, height, grid, margin, dates, locations } = board;
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, margin.left, margin.top, grid);
  labelAxisX(ctx, grid, margin, dates);
  labelAxisY(ctx, grid, margin, locations);
  plotActions(ctx, board, actionRecords);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  grid: GridProperties,
) {
  // Draw the grid's background.
  ctx.fillStyle = grid.fill || getCssVar('--color-background-mute', 'light-dark(#fafafa, #222222)');
  ctx.lineWidth = grid.lineWidth || 1.5;
  ctx.fillRect(originX, originY, grid.width, grid.height);

  // Set the x + y coordinates where each line will start (origin) & end (terminus).
  const terminusX = originX + grid.width;
  const terminusY = originY + grid.height;

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
  ctx: CanvasRenderingContext2D,
  grid: GridProperties,
  margin: BoardMargins,
  dates: Date[],
) {
  // Label the x-axis with the date numeral directly above each column.
  const dateLineheight = Math.floor(margin.top * (5 / 9));
  const dateFontSize = Math.floor(dateLineheight * (5 / 9));
  const dateBaseline = margin.top - Math.floor(dateLineheight * (1 / 3));
  const dateTextMarginLeft = grid.unit * .5;
  dates.forEach((d, i) => {
    const label = d.getDate().toString();
    const x = margin.left + i * grid.unit + dateTextMarginLeft;
    ctx.fillStyle = getCssVar('--color-text');
    ctx.font = `${dateFontSize}px ${getCssVar('--ff-font-family')}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, dateBaseline);
  });
  // Draw a bounding box around both month and date labels.
  ctx.strokeStyle = grid.stroke || getCssVar('--ff-c-green-transparent');
  ctx.strokeRect(margin.left, 0, dates.length * grid.unit, margin.top);

  // Add the months across the top, spread out over the date numerals.
  const months = reduceDatesToMonths(dates);
  const monthLineheight = Math.floor(margin.top * (3 / 9));
  const monthFontSize = Math.floor(monthLineheight * (2 / 3));
  const monthBaseline = monthLineheight - Math.floor(monthLineheight * (1 / 5));
  // Draw a horizontal rule between months and dates.
  ctx.beginPath();
  ctx.moveTo(margin.left, monthLineheight);
  ctx.lineTo(margin.left + dates.length * grid.unit, monthLineheight);
  ctx.stroke();
  months.forEach((month, i) => {
    const width = (month.endCol - month.startCol) * grid.unit;
    const bgX = margin.left + month.startCol * grid.unit;
    // Unless it's the first month, draw a vertical line as its left border to
    // separate it from the previous month, stopping at the top of the grid.
    if (i !== 0) {
      ctx.beginPath();
      ctx.moveTo(bgX, 0);
      ctx.lineTo(bgX, margin.top);
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
  ctx: CanvasRenderingContext2D,
  grid: GridProperties,
  margin: BoardMargins,
  locations: LocationRecord[],
) {
  ctx.fillStyle = getCssVar('--color-text');
  ctx.font = `${grid.unit * .65}px ${getCssVar('--ff-font-family')}`;
  ctx.textAlign = 'end';
  const x = margin.left - 6;
  locations.forEach((loc, i) => {
    const y = margin.top + (i + 1) * grid.unit - grid.unit * .25;
    ctx.fillText(loc.name, x, y);
  });
}

function plotActions(
  ctx: CanvasRenderingContext2D,
  board: BoardProperties,
  actionRecords: ActionRecords,
) {
  const { grid, margin, locations } = board;
  const start = board.dates.slice(0, 1)[0].valueOf();
  const end = board.dates.slice(-1)[0].valueOf();
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
      const originX = margin.left + (gridX - .5) * grid.unit;
      const originY = margin.top + (gridY - .5) * grid.unit;
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
