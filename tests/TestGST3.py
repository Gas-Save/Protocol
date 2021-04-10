from web3 import Web3
from web3.middleware import geth_poa_middleware
import pandas as pd
import os
import json
import numpy as np
from tqdm import tqdm
import time
import unittest

private_key = json.load(open("../keys.json"))['mnemonic']
web3_clients = []

def init_web3():
    infura_urls = ["https://data-seed-prebsc-1-s1.binance.org:8545/",
                   "https://data-seed-prebsc-2-s1.binance.org:8545/",
                   "http://data-seed-prebsc-1-s2.binance.org:8545/",
                   "http://data-seed-prebsc-2-s2.binance.org:8545/",
                   "https://data-seed-prebsc-1-s3.binance.org:8545/",
                   "https://data-seed-prebsc-2-s3.binance.org:8545/",]
    for infura_url in infura_urls:
        w3 = Web3(Web3.HTTPProvider(infura_url))
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        web3_clients.append(w3)


init_web3()
w3 = np.random.choice(web3_clients)
SG3_abi = json.load(open("../build/contracts/SG3Token.json"))['abi']
SG3_address = "0x34ed889fE1ede904C5a18063C9ec89922a1F638b"
SG3_contract = w3.eth.contract(address=SG3_address, abi=SG3_abi)

class TestSG3_Contract(unittest.TestCase):

    def test_upper(self):
        self.assertEqual('foo'.upper(), 'FOO')


if __name__ == '__main__':
    unittest.main()