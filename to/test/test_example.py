#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Unit tests for feat.example module.
"""

import unittest
import json

from feat import Example

class TestExample(unittest.TestCase):
    def test_init(self):
        example = Example(width=10,length=5)
        self.assertEqual(example.width, 10)
        self.assertEqual(example.length, 5)
    def test_area(self):
        self.assertEqual(Example(width=10,length=5).area(), 10*5)
        self.assertEqual(Example(width=10).area(), 10*0)
        self.assertEqual(Example(length=5).area(), 0*5)
