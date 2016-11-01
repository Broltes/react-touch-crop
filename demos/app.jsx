import React from 'react';
import { render } from 'react-dom';
import './app.less';

import Crop from '../src/react-touch-crop';

let file = {
    getFromEvent(e){
        var target = e.target;
        var files = [].slice.call(target.files);// convert filelist to normal array
        target.value = null;// reset

        return files;
    },

    readImg: function(file, cb){
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (e) {
            // replace for android4.x
            cb(e.target.result.replace('data:base64', 'data:image/jpeg;base64'));
        };
    },
};


var App = React.createClass({
    getInitialState() {
        return {};
    },
    imgSelected(e) {
        let imgFile = file.getFromEvent(e)[0];
        if(!imgFile) return;

        file.readImg(imgFile, img => this.setState({ img }))
    },
    crop() {
        alert(this.refs.crop.crop());
    },
    render: function(){
        return (
            <div className="view">
                <header>
                    <label>
                        <input type="file" accept="image/*" onChange={this.imgSelected}/>
                        select img
                    </label>
                    <button onClick={this.crop}>crop</button>
                </header>
                <Crop className="main" ref="crop" img={this.state.img}/>
            </div>
        );
    }
});
render(<App/>, document.getElementById('app'));
