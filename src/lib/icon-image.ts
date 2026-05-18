import { render } from 'takumi-js';
import { container, type Node } from 'takumi-js/helpers';

const YELLOW = '#FFD700';
const BLACK = '#000000';

// Mirror of public/favicon.svg: 5x5 grid, black corners, yellow inner checker.
// (col, row) pairs that are yellow:
const YELLOW_CELLS = new Set<string>([
  '1,0', '3,0',
  '0,1', '2,1', '4,1',
  '1,2', '3,2',
  '0,3', '2,3', '4,3',
  '1,4', '3,4',
]);

function checkerNode(size: number): Node {
  const cellSize = size / 5;
  const rows: Node[] = [];
  for (let row = 0; row < 5; row++) {
    const cells: Node[] = [];
    for (let col = 0; col < 5; col++) {
      const isYellow = YELLOW_CELLS.has(`${col},${row}`);
      cells.push(
        container({
          style: {
            width: cellSize,
            height: cellSize,
            backgroundColor: isYellow ? YELLOW : BLACK,
          },
        }),
      );
    }
    rows.push(
      container({
        style: { display: 'flex', flexDirection: 'row', width: size, height: cellSize },
        children: cells,
      }),
    );
  }
  return container({
    style: { display: 'flex', flexDirection: 'column', width: size, height: size, backgroundColor: BLACK },
    children: rows,
  });
}

export async function renderIcon(size: number): Promise<Uint8Array> {
  return render(checkerNode(size), { width: size, height: size });
}
