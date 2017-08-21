let pathToModule = null;
 
import ballrotate from '3d/ballrotate';
import circle from '3d/circle';
import cone from '3d/cone';
import cube from '3d/cube';
import cylinder from '3d/cylinder';
import model from '3d/model';
import morph3d from '3d/morph3d';
import plane from '3d/plane';
import rect from '3d/rect';
import roundedrect from '3d/roundedrect';
import shape3d from '3d/shape3d';
import sphere from '3d/sphere';
import spherecone from '3d/spherecone';
import teapot from '3d/teapot';
import wiresphere from '3d/wiresphere';
import draggable from 'behaviors/draggable';
import blend from 'blending/blend';
import blur from 'blending/blur';
import dpad from 'flow/controllers/dpad';
import flow_keyboard from 'flow/controllers/keyboard';
import flow_knob from 'flow/controllers/knob';
import xypad from 'flow/controllers/xypad';
import album from 'flow/displays/album';
import debug from 'flow/displays/debug';
import labtext from 'flow/displays/labtext';
import outputs from 'flow/displays/outputs';
import shaderviz from 'flow/displays/shaderviz';
import debugd from 'flow/services/debugd';
import map from 'flow/services/map';
import omdb from 'flow/services/omdb';
import webrequest from 'flow/services/webrequest';
import iot from 'iot/iot';
import accelerometer from 'sensors/accelerometer';
import gyroscope from 'sensors/gyroscope';
import light from 'sensors/light';
import proximity from 'sensors/proximity';
import astio from 'server/astio';
import composition from 'server/composition';
import dataset from 'server/dataset';
import fileio from 'server/fileio';
import role from 'server/role';
import service from 'server/service';
import sourceset from 'server/sourceset';
import tests from 'testing/tests';
import bargraphic from 'ui/bargraphic';
import blurview from 'ui/blurview';
import button from 'ui/button';
import cadgrid from 'ui/cadgrid';
import checkbox from 'ui/checkbox';
import drawer from 'ui/drawer';
import foldcontainer from 'ui/foldcontainer';
import icon from 'ui/icon';
import knob from 'ui/knob';
import label from 'ui/label';
import labelset from 'ui/labelset';
import lifeview from 'ui/lifeview';
import menubar from 'ui/menubar';
import menubutton from 'ui/menubutton';
import noisegrid from 'ui/noisegrid';
import numberbox from 'ui/numberbox';
import radiobutton from 'ui/radiobutton';
import screen from 'ui/screen';
import scrollbar from 'ui/scrollbar';
import slider from 'ui/slider';
import speakergrid from 'ui/speakergrid';
import splitcontainer from 'ui/splitcontainer';
import stackcontainer from 'ui/stackcontainer';
import tabbar from 'ui/tabbar';
import textbox from 'ui/textbox';
import tintview from 'ui/tintview';
import treeview from 'ui/treeview';
import view from 'ui/view';
import audioplayer from 'widgets/audioplayer';
import colorpicker from 'widgets/colorpicker';
import docviewer from 'widgets/docviewer';
import jseditor from 'widgets/jseditor';
import jsviewer from 'widgets/jsviewer';
import geo from 'widgets/map/geo';
import widget_map from 'widgets/map/map';
import mapbuffers from 'widgets/map/mapbuffers';
import mapstyle from 'widgets/map/mapstyle';
import urlfetch from 'widgets/map/urlfetch';
import markdown from 'widgets/markdown';
import palette from 'widgets/palette';
import propeditor from 'widgets/propeditor';
import propviewer from 'widgets/propviewer';
import radiogroup from 'widgets/radiogroup';
import searchbox from 'widgets/searchbox';
import slideviewer from 'widgets/slideviewer';
import table from 'widgets/table';
import background from 'widgets/timeline/background';
import events from 'widgets/timeline/events';
import labels from 'widgets/timeline/labels';
import timeline_scrollbar from 'widgets/timeline/scrollbar';
import timeline from 'widgets/timeline/timeline';
import toolkit from 'widgets/toolkit';
import tracker from 'widgets/tracker';
import videoplayer from 'widgets/videoplayer';

import animate from 'system/base/animate';
import compositionbase from 'system/base/compositionbase';
import compositionclient from 'system/base/compositionclient';
import device from 'system/base/device';
import glslgen from 'system/base/glslgen';
import gltypes from 'system/base/gltypes';
import keyboard from 'system/base/keyboard';
import math from 'system/base/math';
import midi from 'system/base/midi';
import node from 'system/base/node';
import pointer from 'system/base/pointer';
import render from 'system/base/render';
import shader from 'system/base/shader';
import texture from 'system/base/texture';
import worker from 'system/base/worker';
import ansicolor from 'system/debug/ansicolor';
import dump from 'system/debug/dump';
import trace from 'system/debug/trace';
import basicgeometry from 'system/geometry/basicgeometry';
import morphgeometry from 'system/geometry/morphgeometry';
import acorndef from 'system/parse/acorndef';
import acornserializer from 'system/parse/acornserializer';
import astdumper from 'system/parse/astdumper';
import astscanner from 'system/parse/astscanner';
import astwalker from 'system/parse/astwalker';
import htmlparser from 'system/parse/htmlparser';
import imageparser from 'system/parse/imageparser';
import jsdocgen from 'system/parse/jsdocgen';
import jsformatter from 'system/parse/jsformatter';
import onejsdef from 'system/parse/onejsdef';
import onejsgen from 'system/parse/onejsgen';
import onejsparser from 'system/parse/onejsparser';
import onejsserialize from 'system/parse/onejsserialize';
import onejswalk from 'system/parse/onejswalk';
import scripterror from 'system/parse/scripterror';
import wiredwalker from 'system/parse/wiredwalker';
import bootdali from 'system/platform/dali/bootdali';
import compositiondali from 'system/platform/dali/compositiondali';
import dali_actor from 'system/platform/dali/dali_actor';
import dali_api from 'system/platform/dali/dali_api';
import dali_geometry from 'system/platform/dali/dali_geometry';
import dali_layer from 'system/platform/dali/dali_layer';
import dali_material from 'system/platform/dali/dali_material';
import dali_renderer from 'system/platform/dali/dali_renderer';
import dali_shader from 'system/platform/dali/dali_shader';
import daliwrapper from 'system/platform/dali/daliwrapper';
import devicedali from 'system/platform/dali/devicedali';
import drawpassdali from 'system/platform/dali/drawpassdali';
import keyboarddali from 'system/platform/dali/keyboarddali';
import pointerdali from 'system/platform/dali/pointerdali';
import shaderdali from 'system/platform/dali/shaderdali';
import texturedali from 'system/platform/dali/texturedali';
import workerdali from 'system/platform/dali/workerdali';
import bootheadless from 'system/platform/headless/bootheadless';
import compositionheadless from 'system/platform/headless/compositionheadless';
import deviceheadless from 'system/platform/headless/deviceheadless';
import drawpassheadless from 'system/platform/headless/drawpassheadless';
import headless_actor from 'system/platform/headless/headless_actor';
import headless_api from 'system/platform/headless/headless_api';
import headless_geometry from 'system/platform/headless/headless_geometry';
import headless_layer from 'system/platform/headless/headless_layer';
import headless_material from 'system/platform/headless/headless_material';
import headless_renderer from 'system/platform/headless/headless_renderer';
import headless_shader from 'system/platform/headless/headless_shader';
import keyboardheadless from 'system/platform/headless/keyboardheadless';
import pointerheadless from 'system/platform/headless/pointerheadless';
import shaderheadless from 'system/platform/headless/shaderheadless';
import textureheadless from 'system/platform/headless/textureheadless';
import workerheadless from 'system/platform/headless/workerheadless';
import bootnodegl from 'system/platform/nodegl/bootnodegl';
import compositionnodegl from 'system/platform/nodegl/compositionnodegl';
import devicenodegl from 'system/platform/nodegl/devicenodegl';
import drawpassnodegl from 'system/platform/nodegl/drawpassnodegl';
import keyboardnodegl from 'system/platform/nodegl/keyboardnodegl';
import pointernodegl from 'system/platform/nodegl/pointernodegl';
import shadernodegl from 'system/platform/nodegl/shadernodegl';
import texturenodegl from 'system/platform/nodegl/texturenodegl';
import workernodegl from 'system/platform/nodegl/workernodegl';
import compositionnodejs from 'system/platform/nodejs/compositionnodejs';
import devicenodejs from 'system/platform/nodejs/devicenodejs';
import midinodejs from 'system/platform/nodejs/midinodejs';
import shadernodejs from 'system/platform/nodejs/shadernodejs';
import texturenodejs from 'system/platform/nodejs/texturenodejs';
import workernodejs from 'system/platform/nodejs/workernodejs';
import compositionwebgl from 'system/platform/webgl/compositionwebgl';
import debugwebgl from 'system/platform/webgl/debugwebgl';
import devicewebgl from 'system/platform/webgl/devicewebgl';
import drawpasswebgl from 'system/platform/webgl/drawpasswebgl';
import keyboardwebgl from 'system/platform/webgl/keyboardwebgl';
import midiwebgl from 'system/platform/webgl/midiwebgl';
import pointerwebgl from 'system/platform/webgl/pointerwebgl';
import shaderwebgl from 'system/platform/webgl/shaderwebgl';
import texturewebgl from 'system/platform/webgl/texturewebgl';
import workerwebgl from 'system/platform/webgl/workerwebgl';
import busclient from 'system/rpc/busclient';
import busserver from 'system/rpc/busserver';
import rpchub from 'system/rpc/rpchub';
import rpcproxy from 'system/rpc/rpcproxy';
import webrtc from 'system/rpc/webrtc';
import rpc_worker from 'system/rpc/worker';
import childpromise from 'system/server/childpromise';
import compositionserver from 'system/server/compositionserver';
import docbuilder from 'system/server/docbuilder';
import externalapps from 'system/server/externalapps';
import filewatcher from 'system/server/filewatcher';
import gitsync from 'system/server/gitsync';
import mimefromfile from 'system/server/mimefromfile';
import nodehttp from 'system/server/nodehttp';
import nodewebsocket from 'system/server/nodewebsocket';
import rootserver from 'system/server/rootserver';
import runmonitor from 'system/server/runmonitor';
import xmlconverter from 'system/server/xmlconverter';
import colorlib from 'system/shaderlib/colorlib';
import demolib from 'system/shaderlib/demolib';
import materiallib from 'system/shaderlib/materiallib';
import mathlib from 'system/shaderlib/mathlib';
import noiselib from 'system/shaderlib/noiselib';
import palettelib from 'system/shaderlib/palettelib';
import shapelib from 'system/shaderlib/shapelib';
import cursorset from 'system/textbox/cursorset';
import singlecursor from 'system/textbox/singlecursor';
import textboximpl from 'system/textbox/textboximpl';
import cursorshader from 'system/typeface/cursorshader';
import fontsdfgen from 'system/typeface/fontsdfgen';
import markershader from 'system/typeface/markershader';
import typefaceshader from 'system/typeface/typefaceshader';

import buttons from 'examples/buttons';
import checkboxes from 'examples/checkboxes';
import sliders from 'examples/sliders';
import drawers from 'examples/drawers';
import lists from 'examples/lists';
import lebutton from 'examples/button';

import abutton from 'a-toolkit/a-button';
import dreamtoaframe from 'a-toolkit/dreem-to-aframe';

function createPathToModule() {
  pathToModule = {};

  // Examples
  pathToModule['examples/buttons'] = buttons;
  pathToModule['examples/checkboxes'] = checkboxes;
  pathToModule['examples/sliders'] = sliders;
  pathToModule['examples/drawers'] = drawers;
  pathToModule['examples/lists'] = lists;
  pathToModule['examples/button'] = lebutton;

  pathToModule['a-toolkit/a-button'] = abutton;
  pathToModule['a-toolkit/dreem-to-aframe'] = dreamtoaframe;
  
  pathToModule['3d/ballrotate'] = ballrotate;
  pathToModule['3d/circle'] = circle;
  pathToModule['3d/cone'] = cone;
  pathToModule['3d/cube'] = cube;
  pathToModule['3d/cylinder'] = cylinder;
  pathToModule['3d/model'] = model;
  pathToModule['3d/morph3d'] = morph3d;
  pathToModule['3d/plane'] = plane;
  pathToModule['3d/rect'] = rect;
  pathToModule['3d/roundedrect'] = roundedrect;
  pathToModule['3d/shape3d'] = shape3d;
  pathToModule['3d/sphere'] = sphere;
  pathToModule['3d/spherecone'] = spherecone;
  pathToModule['3d/teapot'] = teapot;
  pathToModule['3d/wiresphere'] = wiresphere;
  pathToModule['behaviors/draggable'] = draggable;
  pathToModule['blending/blend'] = blend;
  pathToModule['blending/blur'] = blur;
  pathToModule['flow/controllers/dpad'] = dpad;
  pathToModule['flow/controllers/keyboard'] = flow_keyboard;
  pathToModule['flow/controllers/knob'] = flow_knob;
  pathToModule['flow/controllers/xypad'] = xypad;
  pathToModule['flow/displays/album'] = album;
  pathToModule['flow/displays/debug'] = debug;
  pathToModule['flow/displays/labtext'] = labtext;
  pathToModule['flow/displays/outputs'] = outputs;
  pathToModule['flow/displays/shaderviz'] = shaderviz;
  pathToModule['flow/services/debugd'] = debugd;
  pathToModule['flow/services/map'] = map;
  pathToModule['flow/services/omdb'] = omdb;
  pathToModule['flow/services/webrequest'] = webrequest;
  pathToModule['iot/iot'] = iot;
  pathToModule['sensors/accelerometer'] = accelerometer;
  pathToModule['sensors/gyroscope'] = gyroscope;
  pathToModule['sensors/light'] = light;
  pathToModule['sensors/proximity'] = proximity;
  pathToModule['server/astio'] = astio;
  pathToModule['server/composition'] = composition;
  pathToModule['server/dataset'] = dataset;
  pathToModule['server/fileio'] = fileio;
  pathToModule['server/role'] = role;
  pathToModule['server/service'] = service;
  pathToModule['server/sourceset'] = sourceset;
  pathToModule['system/base/animate'] = animate;
  pathToModule['system/base/compositionbase'] = compositionbase;
  pathToModule['system/base/compositionclient'] = compositionclient;
  pathToModule['system/base/device'] = device;
  pathToModule['system/base/glslgen'] = glslgen;
  pathToModule['system/base/gltypes'] = gltypes;
  pathToModule['system/base/keyboard'] = keyboard;
  pathToModule['system/base/math'] = math;
  pathToModule['system/base/midi'] = midi;
  pathToModule['system/base/node'] = node;
  pathToModule['system/base/pointer'] = pointer;
  pathToModule['system/base/render'] = render;
  pathToModule['system/base/shader'] = shader;
  pathToModule['system/base/texture'] = texture;
  pathToModule['system/base/worker'] = worker;
  pathToModule['system/debug/ansicolor'] = ansicolor;
  pathToModule['system/debug/dump'] = dump;
  pathToModule['system/debug/trace'] = trace;
  pathToModule['system/geometry/basicgeometry'] = basicgeometry;
  pathToModule['system/geometry/morphgeometry'] = morphgeometry;
  pathToModule['system/parse/acorndef'] = acorndef;
  pathToModule['system/parse/acornserializer'] = acornserializer;
  pathToModule['system/parse/astdumper'] = astdumper;
  pathToModule['system/parse/astscanner'] = astscanner;
  pathToModule['system/parse/astwalker'] = astwalker;
  pathToModule['system/parse/htmlparser'] = htmlparser;
  pathToModule['system/parse/imageparser'] = imageparser;
  pathToModule['system/parse/jsdocgen'] = jsdocgen;
  pathToModule['system/parse/jsformatter'] = jsformatter;
  pathToModule['system/parse/onejsdef'] = onejsdef;
  pathToModule['system/parse/onejsgen'] = onejsgen;
  pathToModule['system/parse/onejsparser'] = onejsparser;
  pathToModule['system/parse/onejsserialize'] = onejsserialize;
  pathToModule['system/parse/onejswalk'] = onejswalk;
  pathToModule['system/parse/scripterror'] = scripterror;
  pathToModule['system/parse/wiredwalker'] = wiredwalker;
  pathToModule['system/platform/dali/bootdali'] = bootdali;
  pathToModule['system/platform/dali/compositiondali'] = compositiondali;
  pathToModule['system/platform/dali/daliwrapper'] = daliwrapper;
  pathToModule['system/platform/dali/dali_actor'] = dali_actor;
  pathToModule['system/platform/dali/dali_api'] = dali_api;
  pathToModule['system/platform/dali/dali_geometry'] = dali_geometry;
  pathToModule['system/platform/dali/dali_layer'] = dali_layer;
  pathToModule['system/platform/dali/dali_material'] = dali_material;
  pathToModule['system/platform/dali/dali_renderer'] = dali_renderer;
  pathToModule['system/platform/dali/dali_shader'] = dali_shader;
  pathToModule['system/platform/dali/devicedali'] = devicedali;
  pathToModule['system/platform/dali/drawpassdali'] = drawpassdali;
  pathToModule['system/platform/dali/keyboarddali'] = keyboarddali;
  pathToModule['system/platform/dali/pointerdali'] = pointerdali;
  pathToModule['system/platform/dali/shaderdali'] = shaderdali;
  pathToModule['system/platform/dali/texturedali'] = texturedali;
  pathToModule['system/platform/dali/workerdali'] = workerdali;
  pathToModule['system/platform/headless/bootheadless'] = bootheadless;
  pathToModule['system/platform/headless/compositionheadless'] = compositionheadless;
  pathToModule['system/platform/headless/deviceheadless'] = deviceheadless;
  pathToModule['system/platform/headless/drawpassheadless'] = drawpassheadless;
  pathToModule['system/platform/headless/headless_actor'] = headless_actor;
  pathToModule['system/platform/headless/headless_api'] = headless_api;
  pathToModule['system/platform/headless/headless_geometry'] = headless_geometry;
  pathToModule['system/platform/headless/headless_layer'] = headless_layer;
  pathToModule['system/platform/headless/headless_material'] = headless_material;
  pathToModule['system/platform/headless/headless_renderer'] = headless_renderer;
  pathToModule['system/platform/headless/headless_shader'] = headless_shader;
  pathToModule['system/platform/headless/keyboardheadless'] = keyboardheadless;
  pathToModule['system/platform/headless/pointerheadless'] = pointerheadless;
  pathToModule['system/platform/headless/shaderheadless'] = shaderheadless;
  pathToModule['system/platform/headless/textureheadless'] = textureheadless;
  pathToModule['system/platform/headless/workerheadless'] = workerheadless;
  pathToModule['system/platform/nodegl/bootnodegl'] = bootnodegl;
  pathToModule['system/platform/nodegl/compositionnodegl'] = compositionnodegl;
  pathToModule['system/platform/nodegl/devicenodegl'] = devicenodegl;
  pathToModule['system/platform/nodegl/drawpassnodegl'] = drawpassnodegl;
  pathToModule['system/platform/nodegl/keyboardnodegl'] = keyboardnodegl;
  pathToModule['system/platform/nodegl/pointernodegl'] = pointernodegl;
  pathToModule['system/platform/nodegl/shadernodegl'] = shadernodegl;
  pathToModule['system/platform/nodegl/texturenodegl'] = texturenodegl;
  pathToModule['system/platform/nodegl/workernodegl'] = workernodegl;
  pathToModule['system/platform/nodejs/compositionnodejs'] = compositionnodejs;
  pathToModule['system/platform/nodejs/devicenodejs'] = devicenodejs;
  pathToModule['system/platform/nodejs/midinodejs'] = midinodejs;
  pathToModule['system/platform/nodejs/shadernodejs'] = shadernodejs;
  pathToModule['system/platform/nodejs/texturenodejs'] = texturenodejs;
  pathToModule['system/platform/nodejs/workernodejs'] = workernodejs;
  pathToModule['system/platform/webgl/compositionwebgl'] = compositionwebgl;
  pathToModule['system/platform/webgl/debugwebgl'] = debugwebgl;
  pathToModule['system/platform/webgl/devicewebgl'] = devicewebgl;
  pathToModule['system/platform/webgl/drawpasswebgl'] = drawpasswebgl;
  pathToModule['system/platform/webgl/keyboardwebgl'] = keyboardwebgl;
  pathToModule['system/platform/webgl/midiwebgl'] = midiwebgl;
  pathToModule['system/platform/webgl/pointerwebgl'] = pointerwebgl;
  pathToModule['system/platform/webgl/shaderwebgl'] = shaderwebgl;
  pathToModule['system/platform/webgl/texturewebgl'] = texturewebgl;
  pathToModule['system/platform/webgl/workerwebgl'] = workerwebgl;
  pathToModule['system/rpc/busclient'] = busclient;
  pathToModule['system/rpc/busserver'] = busserver;
  pathToModule['system/rpc/rpchub'] = rpchub;
  pathToModule['system/rpc/rpcproxy'] = rpcproxy;
  pathToModule['system/rpc/webrtc'] = webrtc;
  pathToModule['system/rpc/worker'] = rpc_worker;
  pathToModule['system/server/childpromise'] = childpromise;
  pathToModule['system/server/compositionserver'] = compositionserver;
  pathToModule['system/server/docbuilder'] = docbuilder;
  pathToModule['system/server/externalapps'] = externalapps;
  pathToModule['system/server/filewatcher'] = filewatcher;
  pathToModule['system/server/gitsync'] = gitsync;
  pathToModule['system/server/mimefromfile'] = mimefromfile;
  pathToModule['system/server/nodehttp'] = nodehttp;
  pathToModule['system/server/nodewebsocket'] = nodewebsocket;
  pathToModule['system/server/rootserver'] = rootserver;
  pathToModule['system/server/runmonitor'] = runmonitor;
  pathToModule['system/server/xmlconverter'] = xmlconverter;
  pathToModule['system/shaderlib/colorlib'] = colorlib;
  pathToModule['system/shaderlib/demolib'] = demolib;
  pathToModule['system/shaderlib/materiallib'] = materiallib;
  pathToModule['system/shaderlib/mathlib'] = mathlib;
  pathToModule['system/shaderlib/noiselib'] = noiselib;
  pathToModule['system/shaderlib/palettelib'] = palettelib;
  pathToModule['system/shaderlib/shapelib'] = shapelib;
  pathToModule['system/textbox/cursorset'] = cursorset;
  pathToModule['system/textbox/singlecursor'] = singlecursor;
  pathToModule['system/textbox/textboximpl'] = textboximpl;
  pathToModule['system/typeface/cursorshader'] = cursorshader;
  pathToModule['system/typeface/fontsdfgen'] = fontsdfgen;
  pathToModule['system/typeface/markershader'] = markershader;
  pathToModule['system/typeface/typefaceshader'] = typefaceshader;
  pathToModule['testing/tests'] = tests;
  pathToModule['ui/bargraphic'] = bargraphic;
  pathToModule['ui/blurview'] = blurview;
  pathToModule['ui/button'] = button;
  pathToModule['ui/cadgrid'] = cadgrid;
  pathToModule['ui/checkbox'] = checkbox;
  pathToModule['ui/drawer'] = drawer;
  pathToModule['ui/foldcontainer'] = foldcontainer;
  pathToModule['ui/icon'] = icon;
  pathToModule['ui/knob'] = knob;
  pathToModule['ui/label'] = label;
  pathToModule['ui/labelset'] = labelset;
  pathToModule['ui/lifeview'] = lifeview;
  pathToModule['ui/menubar'] = menubar;
  pathToModule['ui/menubutton'] = menubutton;
  pathToModule['ui/noisegrid'] = noisegrid;
  pathToModule['ui/numberbox'] = numberbox;
  pathToModule['ui/radiobutton'] = radiobutton;
  pathToModule['ui/screen'] = screen;
  pathToModule['ui/scrollbar'] = scrollbar;
  pathToModule['ui/slider'] = slider;
  pathToModule['ui/speakergrid'] = speakergrid;
  pathToModule['ui/splitcontainer'] = splitcontainer;
  pathToModule['ui/stackcontainer'] = stackcontainer;
  pathToModule['ui/tabbar'] = tabbar;
  pathToModule['ui/textbox'] = textbox;
  pathToModule['ui/tintview'] = tintview;
  pathToModule['ui/treeview'] = treeview;
  pathToModule['ui/view'] = view;
  pathToModule['widgets/audioplayer'] = audioplayer;
  pathToModule['widgets/colorpicker'] = colorpicker;
  pathToModule['widgets/docviewer'] = docviewer;
  pathToModule['widgets/jseditor'] = jseditor;
  pathToModule['widgets/jsviewer'] = jsviewer;
  pathToModule['widgets/map/geo'] = geo;
  pathToModule['widgets/map/map'] = widget_map;
  pathToModule['widgets/map/mapbuffers'] = mapbuffers;
  pathToModule['widgets/map/mapstyle'] = mapstyle;
  pathToModule['widgets/map/urlfetch'] = urlfetch;
  pathToModule['widgets/markdown'] = markdown;
  pathToModule['widgets/palette'] = palette;
  pathToModule['widgets/propeditor'] = propeditor;
  pathToModule['widgets/propviewer'] = propviewer;
  pathToModule['widgets/radiogroup'] = radiogroup;
  pathToModule['widgets/searchbox'] = searchbox;
  pathToModule['widgets/slideviewer'] = slideviewer;
  pathToModule['widgets/table'] = table;
  pathToModule['widgets/timeline/background'] = background;
  pathToModule['widgets/timeline/events'] = events;
  pathToModule['widgets/timeline/labels'] = labels;
  pathToModule['widgets/timeline/scrollbar'] = timeline_scrollbar;
  pathToModule['widgets/timeline/timeline'] = timeline;
  pathToModule['widgets/toolkit'] = toolkit;
  pathToModule['widgets/tracker'] = tracker;
  pathToModule['widgets/videoplayer'] = videoplayer;  
}

export default function lookupInImportLibrary(path) {
  // We do this here so we have late-binding properties on our imports
  // if we did this immediately, our libraries would all be undefined
  // becuase they wouldn't have loaded yet (circular import issues with es6)
  try {
    createPathToModule();
  } catch (e) {
    console.error(`swallowing ${e}`);
  }
  
  if (path.startsWith("/")) path = path.slice(1);
  if (path.endsWith(".js")) path = path.slice(0,-3);
  return pathToModule[path];
}
