#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Example object models.
"""

class Example(object):
    """An example object.
    """
    def __init__(self, width=0, length=0):
        """Initializes a new example.

        Kwargs:
            width (float): The width in meters (default 0).
            length (float): The length in meters (default 0).
        """
        self.width = width
        self.length = length

    def area(self):
        """Computes the area of this example.

        Returns:
            float. The area (square meters) computed as the width times the length.
        """
        return self.width * self.length
