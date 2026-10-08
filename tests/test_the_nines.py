import json
from playwright.sync_api import Page, expect


def _add_item(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('input').press('Enter')


def _seed_history(page: Page, history: dict):
    page.evaluate(f"localStorage.setItem('emdash-history', JSON.stringify({json.dumps(history)}))")
    page.reload()


def test_nines_hidden_with_no_history(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    expect(page.locator('the-nines').locator('.trigger')).to_have_count(0)


def test_nines_visible_after_adding_item(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')

    expect(page.locator('the-nines').locator('.trigger')).to_be_visible()


def test_nines_opens_on_click(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 3})

    expect(page.locator('the-nines').locator('.grid')).to_have_count(0)
    page.locator('the-nines').locator('.trigger').click()
    expect(page.locator('the-nines').locator('.grid')).to_be_visible()


def test_nines_shows_correct_order(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 5, 'flux capacitor': 3, 'dilithium': 1})

    page.locator('the-nines').locator('.trigger').click()
    labels = page.locator('the-nines').locator('.cell-label').all()
    names = [l.inner_text() for l in labels]

    assert names[0] == 'wormhole'
    assert names[1] == 'flux capacitor'
    assert names[2] == 'dilithium'


def test_nines_caps_at_nine_items(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    history = {f'item{i}': 10 - i for i in range(12)}
    _seed_history(page, history)

    page.locator('the-nines').locator('.trigger').click()
    filled = page.locator('the-nines').locator('.cell--filled').all()
    assert len(filled) == 9


def test_nines_cell_adds_item(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 2})

    page.locator('the-nines').locator('.trigger').click()
    page.locator('the-nines').locator('.cell-add').first.click()

    item = page.locator('grocery-list').locator('.item-name')
    expect(item).to_have_text('wormhole')


def test_nines_closes_after_picking(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 2})

    page.locator('the-nines').locator('.trigger').click()
    page.locator('the-nines').locator('.cell-add').first.click()

    expect(page.locator('the-nines').locator('.grid')).to_have_count(0)


def test_nines_renders_3x3_grid(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 5, 'flux capacitor': 3, 'dilithium': 1})

    page.locator('the-nines').locator('.trigger').click()
    cells = page.locator('the-nines').locator('.cell').all()

    assert len(cells) == 9


def test_nines_empty_cells_have_no_label(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 1})

    page.locator('the-nines').locator('.trigger').click()
    filled = page.locator('the-nines').locator('.cell--filled').all()
    empty = page.locator('the-nines').locator('.cell--empty').all()

    assert len(filled) == 1
    assert len(empty) == 8


def test_nines_remove_button_removes_from_grid(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 5, 'flux capacitor': 3})

    page.locator('the-nines').locator('.trigger').click()
    expect(page.locator('the-nines').locator('.cell--filled')).to_have_count(2)

    page.locator('the-nines').locator('.cell-remove').first.click()

    expect(page.locator('the-nines').locator('.cell--filled')).to_have_count(1)


def test_nines_remove_persists_to_localstorage(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 5, 'flux capacitor': 3})

    page.locator('the-nines').locator('.trigger').click()
    page.locator('the-nines').locator('.cell-remove').first.click()

    history = json.loads(page.evaluate("localStorage.getItem('emdash-history')"))
    assert 'wormhole' not in history
    assert 'flux capacitor' in history


def test_nines_remove_does_not_add_item(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    _seed_history(page, {'wormhole': 2})

    page.locator('the-nines').locator('.trigger').click()
    page.locator('the-nines').locator('.cell-remove').first.click()

    expect(page.locator('grocery-list')).to_have_count(0)
