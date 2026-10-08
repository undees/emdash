import json
from playwright.sync_api import Page, expect


def _add_item(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('input').press('Enter')


def _add_aisle(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('.btn-aisle').click()


def _seed(page: Page, data: dict):
    page.evaluate(f"localStorage.setItem('emdash-list', JSON.stringify({json.dumps(data)}))")
    page.reload()


def test_move_button_absent_with_no_aisles(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')

    expect(page.locator('grocery-list').locator('.move-btn')).to_have_count(0)


def test_move_button_present_when_aisles_exist(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_aisle(page, 'Misc')

    expect(page.locator('grocery-list').locator('.move-btn')).to_have_count(1)


def test_picker_opens_on_tap(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_aisle(page, 'Misc')

    expect(page.locator('grocery-list').locator('.aisle-picker')).to_have_count(0)
    page.locator('grocery-list').locator('.move-btn').click()
    expect(page.locator('grocery-list').locator('.aisle-picker')).to_have_count(1)


def test_picker_shows_aisle_and_no_aisle_options(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_aisle(page, 'Misc')
    _add_aisle(page, 'Stuff')

    page.locator('grocery-list').locator('.move-btn').click()
    options = page.locator('grocery-list').locator('.aisle-option')
    expect(options).to_have_count(3)  # Misc, Stuff, No aisle
    expect(options.nth(0)).to_have_text('Misc')
    expect(options.nth(1)).to_have_text('Stuff')
    expect(options.nth(2)).to_have_text('No aisle')


def test_picker_closes_on_second_tap(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')
    _add_aisle(page, 'Misc')

    page.locator('grocery-list').locator('.move-btn').click()
    expect(page.locator('grocery-list').locator('.aisle-picker')).to_have_count(1)

    page.locator('grocery-list').locator('.move-btn').click()
    expect(page.locator('grocery-list').locator('.aisle-picker')).to_have_count(0)


def test_move_floating_item_into_aisle(page: Page, base_url: str):
    page.goto(base_url)
    _seed(page, {
        'floatingItems': [{'id': 'i1', 'name': 'Milk'}],
        'aisles': [{'id': 'a1', 'name': 'Dairy', 'items': []}],
    })

    page.locator('grocery-list').locator('.move-btn').click()
    page.locator('grocery-list').locator('.aisle-option', has_text='Dairy').click()

    stored = page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")
    assert stored['floatingItems'] == []
    assert stored['aisles'][0]['items'][0]['name'] == 'Milk'


def test_move_aisle_item_to_different_aisle(page: Page, base_url: str):
    page.goto(base_url)
    _seed(page, {
        'floatingItems': [],
        'aisles': [
            {'id': 'a1', 'name': 'Dairy', 'items': [{'id': 'i1', 'name': 'Milk'}]},
            {'id': 'a2', 'name': 'Produce', 'items': []},
        ],
    })

    page.locator('grocery-list').locator('.move-btn').click()
    page.locator('grocery-list').locator('.aisle-option', has_text='Produce').click()

    stored = page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")
    assert stored['aisles'][0]['items'] == []
    assert stored['aisles'][1]['items'][0]['name'] == 'Milk'


def test_move_aisle_item_back_to_floating(page: Page, base_url: str):
    page.goto(base_url)
    _seed(page, {
        'floatingItems': [],
        'aisles': [{'id': 'a1', 'name': 'Dairy', 'items': [{'id': 'i1', 'name': 'Butter'}]}],
    })

    page.locator('grocery-list').locator('.move-btn').click()
    page.locator('grocery-list').locator('.aisle-option--none').click()

    stored = page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")
    assert stored['floatingItems'][0]['name'] == 'Butter'
    assert stored['aisles'][0]['items'] == []
