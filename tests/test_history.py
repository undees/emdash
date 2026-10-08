from playwright.sync_api import Page


def _add_item(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('input').press('Enter')


def _add_aisle(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('.btn-aisle').click()


def _history(page: Page):
    return page.evaluate("JSON.parse(localStorage.getItem('emdash-history')) ?? {}")


def test_adding_item_records_history(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')

    history = _history(page)
    assert history.get('wormhole') == 1


def test_adding_same_item_twice_increments_count(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_item(page, 'wormhole')

    history = _history(page)
    assert history.get('wormhole') == 2


def test_history_preserved_after_forget_everything(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    page.locator('em-dash').locator('.forget-btn').click()

    history = _history(page)
    assert history.get('wormhole') == 1


def test_history_uses_typed_name_not_canonical(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Turg')

    history = _history(page)
    assert history.get('Turg') == 1
    assert 'Detergent' not in history


def test_burn_it_all_down_clears_history(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_aisle(page, 'BURN IT ALL DOWN')

    history = page.evaluate("localStorage.getItem('emdash-history')")
    assert history is None


def test_multiple_items_each_tracked(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_item(page, 'flux capacitor')
    _add_item(page, 'wormhole')

    history = _history(page)
    assert history.get('wormhole') == 2
    assert history.get('flux capacitor') == 1
