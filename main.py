from typing import List
from pydantic import BaseModel, BaseConfig
import logging
from datetime import timedelta, datetime


class Item(BaseModel):
    """
    General Maintainable object, like a 'car' which can have sub items like tyre, battery, oil etc.  
    """
    name: str
    description: str = None
    items = []
    change_interval: timedelta = None 

    def create_item(self, name: str):
        """Creates child item for the item."""
        child_item = Item(name=name)
        self.items.append(child_item)
        logging.debug(f"Child Item added: {child_item.name}")
        

    class Manufacturer(BaseModel):
        name: str = None
        manufacturer_type: str = None

class User(BaseModel):
    """
    User object which can create maintainable items. 
    """
    name: str 
    items: List[Item] = [] 
    
    def create_item(self, name: str):
        """
        Creates maintainable item under the user. Most likely some abstract object like 
        house, car or bike.
        """
        item = Item(name=name)
        self.items.append(item)
        return item


def create_user(name: str) -> User:
    user = User(name=name)
    return user

def get_items(user: User) -> List[Item]:
    return user.items




