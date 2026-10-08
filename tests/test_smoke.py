from playwright.sync_api import Page, expect


def test_app_loads_with_header(page: Page, base_url: str):
    page.goto(base_url)
    header = page.locator("em-dash").locator("h1")
    expect(header).to_have_text("Em Dash")


def test_empty_state_message(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()
    empty = page.locator("em-dash").locator(".empty")
    expect(empty).to_contain_text("The list is empty")


def test_add_and_remove_item(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    input_el = page.locator("add-item").locator("input")
    input_el.fill("wormhole")
    input_el.press("Enter")

    item = page.locator("grocery-list").locator(".item-name")
    expect(item).to_have_text("wormhole")

    remove_btn = page.locator("grocery-list").locator(".remove-btn")
    remove_btn.click()

    empty = page.locator("em-dash").locator(".empty")
    expect(empty).to_be_visible()
