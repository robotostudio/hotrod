import { render } from 'takumi-js';
import { container, text, type Node } from 'takumi-js/helpers';

export type OgVariant = 'page' | 'home';

const YELLOW = '#FFD700';
const BLACK = '#000000';
const WIDTH = 1200;
const HEIGHT = 630;
const SQUARE = 40;
const COLUMNS = WIDTH / SQUARE;
const STRIP_HEIGHT = SQUARE * 2;

function chequerRow(blackFirst: boolean): Node {
  const cells: Node[] = [];
  for (let i = 0; i < COLUMNS; i++) {
    const isBlack = (i % 2 === 0) === blackFirst;
    cells.push(
      container({
        style: { width: SQUARE, height: SQUARE, backgroundColor: isBlack ? BLACK : YELLOW },
      }),
    );
  }
  return container({
    style: { display: 'flex', flexDirection: 'row', width: WIDTH, height: SQUARE },
    children: cells,
  });
}

function chequerStrip(): Node {
  return container({
    style: { display: 'flex', flexDirection: 'column', width: WIDTH, height: STRIP_HEIGHT },
    children: [chequerRow(true), chequerRow(false)],
  });
}

function fitTitleSize(title: string): number {
  const length = title.length;
  if (length <= 24) return 96;
  if (length <= 40) return 80;
  if (length <= 60) return 64;
  if (length <= 90) return 52;
  return 42;
}

function pageVariant(title: string): Node {
  return container({
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: YELLOW,
    },
    children: [
      container({
        style: {
          flexGrow: 1,
          display: 'flex',
          alignItems: 'flex-end',
          paddingLeft: 72,
          paddingRight: 72,
          paddingBottom: 56,
        },
        children: [
          text(title.toUpperCase(), {
            fontFamily: 'Geist',
            fontWeight: 900,
            color: BLACK,
            fontSize: fitTitleSize(title),
            lineHeight: 0.95,
            letterSpacing: -2,
          }),
        ],
      }),
      chequerStrip(),
    ],
  });
}

function homeVariant(): Node {
  const wordSize = 116;
  return container({
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: YELLOW,
    },
    children: [
      chequerStrip(),
      container({
        style: {
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        },
        children: [
          text('CALL 1800', {
            fontFamily: 'Geist',
            fontWeight: 900,
            color: BLACK,
            fontSize: wordSize,
            lineHeight: 1,
            letterSpacing: -4,
          }),
          container({
            style: {
              backgroundColor: BLACK,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 32,
              paddingRight: 32,
              display: 'flex',
            },
            children: [
              text('HOT ROD', {
                fontFamily: 'Geist',
                fontWeight: 900,
                color: YELLOW,
                fontSize: wordSize,
                lineHeight: 1,
                letterSpacing: -4,
              }),
            ],
          }),
        ],
      }),
      chequerStrip(),
    ],
  });
}

export async function renderOgImage(opts: {
  title: string;
  variant: OgVariant;
}): Promise<Uint8Array> {
  const node = opts.variant === 'home' ? homeVariant() : pageVariant(opts.title);
  return render(node, { width: WIDTH, height: HEIGHT });
}
