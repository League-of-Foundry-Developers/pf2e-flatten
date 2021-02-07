# pf2e-flatten

A module to apply the proficiency without level changes to PF2e NPCs in FoundryVTT. This module overhauls the NPC Flattening function from the excellent PF2e-Toolbox https://github.com/Djphoenix719/FVTT-PF2EToolbox/releases module, to make it compatible with the new NPC character sheets. If you are switching over from the PF2e toolbox to this module, you will need to unflatten any NPCs flattened with the Toolbox module and reflatten them with this module.  

This modules adds a new menu option when you right click on any NPC in your actor directory that allows you to flatten them. Which is to say it subtracts their current level from saves, skills, attacks and spell DCs. It also has a corresponding function that allows you to reverse that process.

The module also adds toggleable functionality to automatically flatten any NPCs that you drag out of a compendium into your world. This automatic flattening won't affect new NPC you create from scratch, instead if you are manually entering NPC stats that you need to flatten, you can flatten them using the context menu above. Furthermore, if you store any of your flattened NPCs in compendiums the automatic flattening functionality will skip them when you reimport them into your active world.

Note: the flattening is based on the NPCs current level, which means if you adjust the NPCs level prior to unflattening the resulting NPC will have different stats than the original to reflect its new level. 

The DCs of recall knowledge checks for NPCs are presently handled automatically by the Proficiency without Level variant rule built into the PF2e core system. 

This module falls under the Apache 2.0 License, and would not have been possible without the foundtions developed by DJphoenix719 in their PF2e-Toolbox module.



