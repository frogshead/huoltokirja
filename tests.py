import main
import pytest

def test_should_create_user():
    user = main.create_user(name="Test User")
    assert type(user) is main.User

def test_user_should_be_able_create_maintainable_item():
    user = main.create_user("Test")
    item = user.create_item("Battery")
    
    assert type(item) is main.Item
    assert item.name is "Battery"
    assert item.description is None

def test_should_create_child_item():
    user = main.create_user("Test")
    user.create_item("Car").create_item("battery")
    assert type(user.items[0].items[0]) is main.Item

def test_should_get_user_items():
    items = []
    user = main.create_user("Test")
    user.create_item("Car").create_item("Battery")
    items = main.get_items(user)
    assert items.count != 0