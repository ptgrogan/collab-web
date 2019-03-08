#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Feb  4 14:29:03 2019

@author: james
"""

#create class battery
class Battery_class(object):
    
    battery_out = {}
    battery_in = {}

    
    #add assumption variables:
    volts_per_cell = 3.7
    mass_per_cell = 0.057
    
    #define class
    def __init__(self, number_cell, energy_cell, x_location, payload_mass):
        self.number_cell = number_cell
        self.energy_cell = energy_cell
        self.x_location = x_location
        self.payload_mass = payload_mass
        
    #create function for filling input dictionary
    def inputs(self):
        
        self.battery_in['volts_per_cell'] = round(float(self.volts_per_cell),4)
        self.battery_in['mass_per_cell'] = round(float(self.mass_per_cell),4)
        self.battery_in['number_cell'] = int(self.number_cell)
        self.battery_in['energy_cell'] = round(float(self.energy_cell),4)
        self.battery_in['x_location'] = round(float(self.x_location), 4)
        self.battery_in['payload_mass'] = round(float(self.payload_mass),4)


    
    #define function for filling battery output dictionary
    def outputs(self):
        #calculate available energy from battery in Joules
        total_energy = int(self.number_cell) * round(float((self.energy_cell)),4)
        total_voltage = int(self.number_cell) * round(float(self.volts_per_cell),4)
        energy_available = round(total_energy * total_voltage,4)

        #caluculate total mass of payload and battery in kg
        total_battery_mass = int(self.number_cell) * round(float((self.mass_per_cell)),4)
        total_payload_and_battery = round(total_battery_mass + self.battery_in['payload_mass'],4)

        #add mass information to battery output dictionary
        self.battery_out['energy_available'] = energy_available
        self.battery_out['total_payload_mass'] = total_payload_and_battery
    
    #define print function    
    def print_(self):
        print(' ')
        print('inputs: ')
        print(' ')
        for x in self.battery_in:
            print(x, ':', self.battery_in[x])
        print(' ')
        print('outputs:')
        print(' ')
        for x in self.battery_out:
            print(x, ':', self.battery_out[x])

test = Battery_class(input('Number of Cells? '),input('Energy per Cell in Ahr? '),input('X location of payload com in meters? '),input('Payload Mass in kg? '))

test.inputs()

test.outputs()

test.print_()