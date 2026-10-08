from playwright.sync_api import Page, expect
import json


def _add_item(page: Page, name: str):
    input_el = page.locator("add-item").locator("input")
    input_el.fill(name)
    input_el.press("Enter")


def _add_aisle(page: Page, name: str):
    input_el = page.locator("add-item").locator("input")
    input_el.fill(name)
    page.locator("add-item").locator(".btn-aisle").click()


def test_create_aisle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    _add_aisle(page, "Produce")

    header = page.locator("grocery-list").locator(".aisle-name-btn")
    expect(header).to_have_text("Produce")


def test_aisle_persists_to_localstorage(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    _add_aisle(page, "Dairy")

    stored = page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")
    assert stored["aisles"][0]["name"] == "Dairy"
    assert stored["aisles"][0]["items"] == []


def test_rename_aisle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    _add_aisle(page, "Produce")
    page.locator("grocery-list").locator(".aisle-name-btn").click()

    edit_input = page.locator("grocery-list").locator(".aisle-edit-input")
    edit_input.fill("Fruit & Veg")
    edit_input.press("Enter")

    header = page.locator("grocery-list").locator(".aisle-name-btn")
    expect(header).to_have_text("Fruit & Veg")


def test_cancel_aisle_rename(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    _add_aisle(page, "Produce")
    page.locator("grocery-list").locator(".aisle-name-btn").click()

    edit_input = page.locator("grocery-list").locator(".aisle-edit-input")
    edit_input.fill("Something else")
    edit_input.press("Escape")

    header = page.locator("grocery-list").locator(".aisle-name-btn")
    expect(header).to_have_text("Produce")


def test_delete_aisle_moves_items_to_floating(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    data = {
        "floatingItems": [],
        "aisles": [{
            "id": "aisle1",
            "name": "Produce",
            "items": [
                {"id": "item1", "name": "Lettuce"},
                {"id": "item2", "name": "Apples"},
            ]
        }]
    }
    page.evaluate(f"localStorage.setItem('emdash-list', '{json.dumps(data)}')")
    page.reload()

    page.locator("grocery-list").locator(".aisle-action-btn").last.click()

    items = page.locator("grocery-list").locator(".item-name").all()
    names = [i.inner_text() for i in items]
    assert "Lettuce" in names
    assert "Apples" in names

    stored = page.evaluate("JSON.parse(localStorage.getItem('emdash-list'))")
    assert stored["aisles"] == []
    assert len(stored["floatingItems"]) == 2


def test_burn_it_all_down_clears_history(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.evaluate("localStorage.setItem('emdash-history', JSON.stringify({'Milk': 5, 'Bread': 3}))")
    page.reload()

    _add_aisle(page, "BURN IT ALL DOWN")

    history = page.evaluate("localStorage.getItem('emdash-history')")
    assert history is None


def test_burn_it_all_down_does_not_create_aisle(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    _add_aisle(page, "BURN IT ALL DOWN")

    headers = page.locator("grocery-list").locator(".aisle-name-btn").all()
    assert len(headers) == 0
