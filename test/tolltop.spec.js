const { test, expect } = require('@playwright/test');
const path = require('path');

const TOLLTOP = path.resolve(__dirname, '..', 'tolltop.js');

async function load(page, body = '') {
  await page.setContent(`<!doctype html><html><head></head><body>${body}</body></html>`);
  await page.addScriptTag({ path: TOLLTOP });
}

const tip = (page) => page.locator('#tolltop-tip');

test.describe('show and hide', () => {
  test('shows on hover, hides on pointer-out', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save">Save</button>');
    await page.hover('#b');
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveText('Save');
    await page.mouse.move(1, 1);
    await expect(tip(page)).toBeHidden();
  });

  test('shows on focus, hides on Escape', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save">Save</button>');
    await page.focus('#b');
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
  });
});

test.describe('empty and whitespace guard', () => {
  for (const [name, value] of [['empty', ''], ['whitespace', '   ']]) {
    test(`does not show for ${name} data-tooltip`, async ({ page }) => {
      await load(page, `<button id="b" data-tooltip="${value}">x</button>`);
      await page.hover('#b');
      await expect(tip(page)).toBeHidden();
    });
  }

  test('still shows a real tooltip after an empty one', async ({ page }) => {
    await load(
      page,
      '<button id="e" data-tooltip="">e</button> <button id="r" data-tooltip="Real">r</button>'
    );
    await page.hover('#e');
    await expect(tip(page)).toBeHidden();
    await page.hover('#r');
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveText('Real');
  });
});

test.describe('accessibility', () => {
  test('wires aria-describedby on show and removes it on hide', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save">Save</button>');
    await page.hover('#b');
    await expect(page.locator('#b')).toHaveAttribute('aria-describedby', 'tolltop-tip');
    await page.mouse.move(1, 1);
    await expect(tip(page)).toBeHidden();
    expect(await page.locator('#b').getAttribute('aria-describedby')).toBeNull();
  });

  test('merges and restores an existing aria-describedby', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save" aria-describedby="foo">Save</button>');
    await page.hover('#b');
    await expect(page.locator('#b')).toHaveAttribute('aria-describedby', 'foo tolltop-tip');
    await page.mouse.move(1, 1);
    await expect(tip(page)).toBeHidden();
    await expect(page.locator('#b')).toHaveAttribute('aria-describedby', 'foo');
  });
});

test.describe('config API', () => {
  test('returns the defaults as a copy', async ({ page }) => {
    await load(page);
    const cfg = await page.evaluate(() => window.tolltop());
    expect(cfg).toMatchObject({
      maxWidth: 240,
      placement: 'auto',
      gap: 10,
      edge: 24,
      bg: null,
      color: null,
    });
  });

  test('merges known keys, ignores unknown keys, and never leaks the returned copy', async ({ page }) => {
    await load(page);
    const result = await page.evaluate(() => {
      const a = window.tolltop({ gap: 20, placement: 'bottom', nope: 1 });
      a.gap = 999;
      const b = window.tolltop();
      return { unknownIgnored: !('nope' in a), gap: b.gap, placement: b.placement };
    });
    expect(result).toEqual({ unknownIgnored: true, gap: 20, placement: 'bottom' });
  });
});

test.describe('script self-management', () => {
  test('injects its own CSS when tolltop.css is not linked', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save">Save</button>');
    await page.hover('#b');
    await expect(tip(page)).toBeVisible();
    expect(await page.locator('style[data-tolltop]').count()).toBe(1);
    expect(await tip(page).evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  });

  test('is a no-op when included twice', async ({ page }) => {
    await load(page, '<button id="b" data-tooltip="Save">Save</button>');
    await page.addScriptTag({ path: TOLLTOP });
    expect(await page.evaluate(() => window.__tolltop)).toBe(true);
    await page.hover('#b');
    await expect(tip(page)).toBeVisible();
    expect(await tip(page).count()).toBe(1);
  });

  test('works on elements added after init', async ({ page }) => {
    await load(page);
    await page.evaluate(() =>
      document.body.insertAdjacentHTML('beforeend', '<button id="dyn" data-tooltip="Dyn">d</button>')
    );
    await page.hover('#dyn');
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toHaveText('Dyn');
  });
});

test.describe('positioning', () => {
  const fixedBtn = (style, text = 'Tip') =>
    `<button id="b" data-tooltip="${text}" style="position:fixed;${style}">b</button>`;

  test('shows above the trigger by default', async ({ page }) => {
    await load(page, fixedBtn('left:380px;top:300px'));
    await page.hover('#b');
    await expect(tip(page)).toHaveAttribute('data-placement', 'top');
    const b = await page.locator('#b').boundingBox();
    const t = await tip(page).boundingBox();
    expect(t.y + t.height).toBeLessThanOrEqual(b.y);
    const center = t.x + t.width / 2;
    expect(center).toBeGreaterThan(b.x - 5);
    expect(center).toBeLessThan(b.x + b.width + 5);
  });

  test('flips below when there is no room above', async ({ page }) => {
    await load(page, fixedBtn('left:380px;top:2px'));
    await page.hover('#b');
    await expect(tip(page)).toHaveAttribute('data-placement', 'bottom');
    const b = await page.locator('#b').boundingBox();
    const t = await tip(page).boundingBox();
    expect(t.y).toBeGreaterThanOrEqual(b.y + b.height);
  });

  test('shifts inward to keep the edge margin near a viewport side', async ({ page }) => {
    await load(page, fixedBtn('right:2px;top:300px', 'A longer tooltip label that needs room'));
    await page.hover('#b');
    await expect(tip(page)).toBeVisible();
    const t = await tip(page).boundingBox();
    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    expect(t.x).toBeGreaterThanOrEqual(23);
    expect(vw - (t.x + t.width)).toBeGreaterThanOrEqual(23);
    const arrowX = await tip(page).evaluate((el) =>
      parseFloat(getComputedStyle(el).getPropertyValue('--tt-arrow-x'))
    );
    expect(arrowX).toBeGreaterThanOrEqual(0);
    expect(arrowX).toBeLessThanOrEqual(t.width);
  });

  test('hides when the trigger is clipped out of a scroll container', async ({ page }) => {
    await load(
      page,
      `<div id="s" style="position:fixed;left:60px;top:60px;width:200px;height:140px;overflow:auto">
         <div style="height:600px;padding-top:20px">
           <button id="b" data-tooltip="Tip">b</button>
         </div>
       </div>`
    );
    await page.hover('#b');
    await expect(tip(page)).toBeVisible();
    await page.locator('#s').evaluate((el) => el.scrollTo(0, 400));
    await expect(tip(page)).toBeHidden();
  });
});
