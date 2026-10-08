from playwright.sync_api import Page, expect


def test_tagline_shows_the_store_by_default(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("the store")


def test_set_store_via_tagline(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    trigger = page.locator("em-dash").locator(".store-trigger")
    trigger.click()

    store_input = page.locator("em-dash").locator(".store-edit")
    expect(store_input).to_be_visible()
    store_input.fill("Farm Boy")
    store_input.press("Enter")

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("Farm Boy")
    expect(tagline).to_contain_text("Errands")

    stored = page.evaluate("localStorage.getItem('emdash-store')")
    assert stored == "Farm Boy"


def test_store_persists_across_reload(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.evaluate("localStorage.setItem('emdash-store', 'Costco')")
    page.reload()

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("Costco")


def test_clear_store(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.evaluate("localStorage.setItem('emdash-store', 'Costco')")
    page.reload()

    clear_btn = page.locator("em-dash").locator(".store-clear")
    clear_btn.click()

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("the store")

    stored = page.evaluate("localStorage.getItem('emdash-store')")
    assert stored is None


def test_cancel_store_edit_with_escape(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.reload()

    trigger = page.locator("em-dash").locator(".store-trigger")
    trigger.click()

    store_input = page.locator("em-dash").locator(".store-edit")
    store_input.fill("Loblaws")
    store_input.press("Escape")

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("the store")

    stored = page.evaluate("localStorage.getItem('emdash-store')")
    assert stored is None


def test_edit_existing_store(page: Page, base_url: str):
    page.goto(base_url)
    page.evaluate("localStorage.clear()")
    page.evaluate("localStorage.setItem('emdash-store', 'Farm Boy')")
    page.reload()

    trigger = page.locator("em-dash").locator(".store-trigger")
    trigger.click()

    store_input = page.locator("em-dash").locator(".store-edit")
    store_input.fill("Costco")
    store_input.press("Enter")

    tagline = page.locator("em-dash").locator(".tagline")
    expect(tagline).to_contain_text("Costco")

    stored = page.evaluate("localStorage.getItem('emdash-store')")
    assert stored == "Costco"
