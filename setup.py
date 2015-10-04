"""dapple is tool for building and managing complex contract
systems on Ethereum (and Ethereum-based) blockchains.

https://github.com/MakerDAO/dapple
"""

from setuptools import setup, find_packages
from codecs import open
from os import path
from dapple import __version__

here = path.abspath(path.dirname(__file__))
with open(path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='dapple',
    version=__version__,
    description='An Ethereum smart contract build & management tool.',
    long_description=long_description,
    url='https://github.com/MakerDAO/dapple',
    author='Maker DAO',
    author_email='rune@makerdao.com',
    license='Apache License 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'Topic :: Software Development',
        'License :: OSI Approved :: Apache Software License',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
    ],
    keywords='ethereum blockchain development',
    packages=find_packages(exclude=['contrib', 'docs', 'tests*']),
    package_data={'dapple': ['defaults/*']},
    install_requires=[
        'bitcoin',
        'click',
        'cogapp',
        'ethereum-serpent',
        'EtherTDD',
        'pbkdf2',
        'pyaml',
        'pycrypto',
        'pyethash',
        'pysha3',
        'PyYAML',
        'repoze.lru',
        'rlp',
        'ethereum',
        'scrypt',
        'wheel'
    ],
    entry_points={
        'console_scripts': [
            'dapple=dapple.__main__:cli',
        ],
    }
)
