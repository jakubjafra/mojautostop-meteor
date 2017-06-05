#!/bin/sh

# Dump local mongo database from current running server into dump/meteor/

mongodump -h 127.0.0.1:81 -d meteor -o dump
