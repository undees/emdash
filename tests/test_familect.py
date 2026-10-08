import json
from playwright.sync_api import Page, expect


def _add_item(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('input').press('Enter')


def _stored(page: Page):
    return page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")


def test_familect_item_shows_sparkle_name(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Turg')

    item_name = page.locator('grocery-list').locator('.item-name')
    expect(item_name).to_have_text('✨ Turg ✨')


def test_familect_item_shows_subtitle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Turg')

    subtitle = page.locator('grocery-list').locator('.item-subtitle')
    expect(subtitle).to_have_text('Detergent')


def test_familect_item_auto_assigns_via_canonical(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Turg')

    stored = _stored(page)
    household = next((a for a in stored['aisles'] if a['name'] == 'Household'), None)
    assert household is not None, 'Expected a Household aisle to be auto-created'
    assert any(i['name'] == 'Turg' for i in household['items'])
    assert stored['floatingItems'] == []


def test_familect_item_saved_with_original_name(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Turg')

    stored = _stored(page)
    all_items = stored['floatingItems'] + [i for a in stored['aisles'] for i in a['items']]
    assert any(i['name'] == 'Turg' for i in all_items)
    assert not any('Detergent' in i['name'] for i in all_items)


def test_non_familect_item_has_no_subtitle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'wormhole')

    subtitles = page.locator('grocery-list').locator('.item-subtitle').all()
    assert len(subtitles) == 0


def test_feat_auto_assigns_to_deli(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Feat')

    stored = _stored(page)
    deli = next((a for a in stored['aisles'] if a['name'] == 'Deli'), None)
    assert deli is not None, 'Expected a Deli aisle to be auto-created'
    assert any(i['name'] == 'Feat' for i in deli['items'])


def test_silkenhalf_auto_assigns_to_dairy(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'Silkenhalf')

    stored = _stored(page)
    dairy = next((a for a in stored['aisles'] if a['name'] == 'Dairy'), None)
    assert dairy is not None, 'Expected a Dairy aisle to be auto-created'
    assert any(i['name'] == 'Silkenhalf' for i in dairy['items'])
