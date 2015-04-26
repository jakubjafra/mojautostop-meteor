#!/bin/sh

# Dump local mongo database from current running server into dump/meteor/

mongodump -h 127.0.0.1:3001 -d meteor -o dump
