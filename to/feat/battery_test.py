# -*- coding: utf-8 -*-
"""
Created on Wed Mar  6 17:37:42 2019

@author: jlaughla
"""

#create class battery
class Battery_class(object):
      
    #add assumption variables:
    volts_per_cell = 3.7
    mass_per_cell = 0.057
    
    #define class
        
    def __init__(self, number_cell, energy_cell, x_location, payload_mass):
        
        #Kwargs:
        #number_cell (integer): The number of battery cells (default 0):
        #energy_cell (float): The amount of energy in Amp hrs per cell (default 0):
        #x_location (float): The x_location of the payload with respect to the COM in meters (default 0):
        #payload_mass (float): The mass of the payload in kgs (default 0):
        
        self.number_cell = number_cell
        self.energy_cell = energy_cell
        self.x_location = x_location
        self.payload_mass = payload_mass
        
    
    #define function for filling battery output dictionary
    def energy(self):
        #calculate available energy from battery in Joules
        total_energy = int(self.number_cell) * round(float((self.energy_cell)),4)
        total_voltage = int(self.number_cell) * round(float(self.volts_per_cell),4)
        energy_available = round(total_energy * total_voltage,4)
        return energy_available

        #caluculate total mass of payload and battery in kg
    def mass(self):
        total_battery_mass = int(self.number_cell) * round(float((self.mass_per_cell)),4)
        total_payload_and_battery = round(total_battery_mass + self.battery_in['payload_mass'],4)
        return total_payload_and_battery
