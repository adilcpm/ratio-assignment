export type Platform = {
  "version": "0.1.0",
  "name": "platform",
  "instructions": [
    {
      "name": "initializeGlobalState",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stateBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTestToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createFarm",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintTestToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "farmBump",
          "type": "u8"
        },
        {
          "name": "harvestSignerBump",
          "type": "u8"
        },
        {
          "name": "rewardsPerSecond",
          "type": "f32"
        }
      ]
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unStake",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "harvest",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "i64"
    }
  ],
  "accounts": [
    {
      "name": "globalStateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "poolBump",
            "type": "u8"
          },
          {
            "name": "poolAccount",
            "type": "publicKey"
          },
          {
            "name": "mintTestToken",
            "type": "publicKey"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "farmBump",
            "type": "u8"
          },
          {
            "name": "totalStaked",
            "type": "u64"
          },
          {
            "name": "timeOfLastHarvest",
            "type": "i64"
          },
          {
            "name": "rewardsPerSeconds",
            "type": "f32"
          },
          {
            "name": "harvestSignerBump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientFundForWithdrawal",
      "msg": "Trying to Withdraw more than what you have in the pool!"
    },
    {
      "code": 6001,
      "name": "InsufficientFundForStaking",
      "msg": "Trying to Stake more than what you have deposited!"
    },
    {
      "code": 6002,
      "name": "InsufficientFundForUnStaking",
      "msg": "Trying to UnStake more than what you have staked!"
    }
  ]
};

export const IDL: Platform = {
  "version": "0.1.0",
  "name": "platform",
  "instructions": [
    {
      "name": "initializeGlobalState",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stateBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTestToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createFarm",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintTestToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "farmBump",
          "type": "u8"
        },
        {
          "name": "harvestSignerBump",
          "type": "u8"
        },
        {
          "name": "rewardsPerSecond",
          "type": "f32"
        }
      ]
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unStake",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "harvest",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "farmAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "harvestSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalStateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "farmProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "i64"
    }
  ],
  "accounts": [
    {
      "name": "globalStateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stateBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "poolBump",
            "type": "u8"
          },
          {
            "name": "poolAccount",
            "type": "publicKey"
          },
          {
            "name": "mintTestToken",
            "type": "publicKey"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "farmBump",
            "type": "u8"
          },
          {
            "name": "totalStaked",
            "type": "u64"
          },
          {
            "name": "timeOfLastHarvest",
            "type": "i64"
          },
          {
            "name": "rewardsPerSeconds",
            "type": "f32"
          },
          {
            "name": "harvestSignerBump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientFundForWithdrawal",
      "msg": "Trying to Withdraw more than what you have in the pool!"
    },
    {
      "code": 6001,
      "name": "InsufficientFundForStaking",
      "msg": "Trying to Stake more than what you have deposited!"
    },
    {
      "code": 6002,
      "name": "InsufficientFundForUnStaking",
      "msg": "Trying to UnStake more than what you have staked!"
    }
  ]
};