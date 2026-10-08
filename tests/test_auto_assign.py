import json
import pytest
from playwright.sync_api import Page, expect


def _add_aisle(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('.btn-aisle').click()


def _add_item(page: Page, name: str):
    page.locator('add-item').locator('input').fill(name)
    page.locator('add-item').locator('input').press('Enter')


def _stored(page: Page):
    return page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")


def test_item_lands_in_matching_aisle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Dairy')
    _add_item(page, 'whole milk')

    stored = _stored(page)
    aisle = next(a for a in stored['aisles'] if a['name'] == 'Dairy')
    assert any(i['name'] == 'whole milk' for i in aisle['items'])
    assert stored['floatingItems'] == []


def test_multi_word_item_matched_on_contained_word(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Produce')
    _add_item(page, 'roma tomatoes')

    stored = _stored(page)
    aisle = next(a for a in stored['aisles'] if a['name'] == 'Produce')
    assert any(i['name'] == 'roma tomatoes' for i in aisle['items'])
    assert stored['floatingItems'] == []


def test_aisle_created_when_no_matching_aisle_exists(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Dairy')
    _add_item(page, 'salmon')

    stored = _stored(page)
    seafood = next((a for a in stored['aisles'] if a['name'] == 'Seafood'), None)
    assert seafood is not None
    assert any(i['name'] == 'salmon' for i in seafood['items'])
    assert stored['floatingItems'] == []


def test_aisle_created_when_no_aisles_at_all(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_item(page, 'eggs')

    stored = _stored(page)
    dairy = next((a for a in stored['aisles'] if a['name'] == 'Dairy'), None)
    assert dairy is not None
    assert any(i['name'] == 'eggs' for i in dairy['items'])


def test_unknown_item_always_floats(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Dairy')
    _add_aisle(page, 'Produce')
    _add_item(page, 'wormhole')

    stored = _stored(page)
    assert any(i['name'] == 'wormhole' for i in stored['floatingItems'])


def test_item_lands_in_seafood_aisle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Seafood')
    _add_item(page, 'smoked salmon')

    stored = _stored(page)
    aisle = next(a for a in stored['aisles'] if a['name'] == 'Seafood')
    assert any(i['name'] == 'smoked salmon' for i in aisle['items'])
    assert stored['floatingItems'] == []


def test_canned_tomatoes_go_to_pantry_not_produce(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Produce')
    _add_item(page, 'canned tomatoes')

    stored = _stored(page)
    produce = next((a for a in stored['aisles'] if a['name'] == 'Produce'), None)
    pantry = next((a for a in stored['aisles'] if a['name'] == 'Pantry'), None)
    assert produce is not None
    assert len(produce['items']) == 0
    assert pantry is not None
    assert any(i['name'] == 'canned tomatoes' for i in pantry['items'])


def test_plain_tomatoes_go_to_produce(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'Produce')
    _add_item(page, 'Tomatoes (3)')

    stored = _stored(page)
    produce = next((a for a in stored['aisles'] if a['name'] == 'Produce'), None)
    assert produce is not None
    assert any(i['name'] == 'Tomatoes (3)' for i in produce['items'])
    assert stored['floatingItems'] == []


def test_case_insensitive_aisle_name_match(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate('localStorage.clear()')
    page.reload()

    _add_aisle(page, 'dairy')
    _add_item(page, 'butter')

    stored = _stored(page)
    aisle = next(a for a in stored['aisles'] if a['name'] == 'dairy')
    assert any(i['name'] == 'butter' for i in aisle['items'])
    assert stored['floatingItems'] == []
