import React, {Component} from "react";
import { Layout, Divider, List, ListItem, Icon, Text, Datepicker, Card, Button, ButtonGroup, IndexPath, Select, SelectItem} from '@ui-kitten/components';
import { ImageBackground, View, StyleSheet, RefreshControl, ScrollView , Image} from "react-native";

import { MomentDateService } from '@ui-kitten/moment';

import Axios from "axios";
import moment from "moment";

import AsyncStorage from '@react-native-community/async-storage';

import {ApiConfig} from "./config/ApiConfig";

import { connect } from 'react-redux';
import { syncSessions } from "./Redux/actions/Session.actions";
import { updateFirstTimeLoggedIn } from "./Redux/actions/user.actions";
import { changeTitle } from "./Redux/actions/SessionScreen.actions";
import { bindActionCreators } from 'redux';

class ActivitiesScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            date: moment(),
            activities: "",
            welcomeModalVisibility: false,
            nomatchModalVisibility: false,
            regions:[
                'All',
                'San Rafael',
                'San Francisco',
                'Oakland',
            ],
            selectedIndex: "",
            displayedValue: "",
            isUpdated: false,
            teamSeasonId: "",
            listofSessions: null,
            seasonName: "",
        }
    }

    

    async componentDidMount() {
        this._syncActivities();
        await AsyncStorage.setItem('loggedStatus', "true");
        if (this.props.user.firstTimeLoggedIn) {
            setTimeout(() => (this.setState({welcomeModalVisibility: true})), 500);
            setTimeout(() => {this.setState({welcomeModalVisibility: false})}, 3500);
        }
        console.log(this.props.user);
    }

    async _syncActivities() {
        const { route } = this.props;
        //Syncs activities from endpoint
        this.fetchActivities()
            .then(activitiesList => this._syncReduxActivities(activitiesList))    
            .then(() =>{
                //Check if we are in the team activities name
                if (route.name === "Team Sessions" && route.params && route.params.teamSeasonId){
                    this.filterActivitiesByTeamSeasonId(route.params.teamSeasonId); // filter the activities for a specific team
                    this.setState({isUpdated: true, teamSeasonId: route.params.teamSeasonId});
                }
            })
            .catch(error => console.log(error));
    }

    //Syncs activitiesToRedux and state
    _syncReduxActivities(activitiesList) {
        const { actions } = this.props;
        const { route } = this.props;
        this.setState({listofSessions: null});
        actions.syncSessions(activitiesList);
        this.setState({activities: activitiesList});
        ((activitiesList.length === 0)? 
        (this.setState({seasonName: "Sessions", nomatchModalVisibility: true}))//saving seasonName
        :
        (this.setState({seasonName: activitiesList[0].Season_Name ,nomatchModalVisibility: false})))//saving seasonName
        activitiesList.map(value => {
                if(value.Sessions !== null){
                    this.setState({ listofSessions: value.Sessions})
                }
            });
        if(this.state.listofSessions === null){
            this.setState({nomatchModalVisibility: true})
        }else{
            this.setState({nomatchModalVisibility: false})
        }
        if(route.name === "Team Sessions"){
            this.filterActivitiesByTeamSeasonId(route.params.teamSeasonId); // filter the activities for a specific team
            this.setState({isUpdated: true, teamSeasonId: route.params.teamSeasonId});
        }
        if (this.state.seasonName !== ""){
            if(this.state.seasonName !== "Sessions"){
                actions.changeTitle(this.state.seasonName + " " + "Sessions")//shows the actual season name
            }else{
                actions.changeTitle(this.state.seasonName)//shows the actual season name
            }
        }
    }

    filterActivitiesByTeamSeasonId(teamSeasonId) {
        this.setState({listofSessions: null});
        const activities = this.state.activities.filter(
            activity => { if (activity.Sessions) return activity.Sessions[0].TeamSeasonId === teamSeasonId;});
        this.setState({activities: activities});
        activities.map(value => {
            if(value.Sessions !== null){
                this.setState({ listofSessions: value.Sessions})
            }
        });
        if(this.state.listofSessions === null){
            this.setState({nomatchModalVisibility: true})
        }else{
            this.setState({nomatchModalVisibility: false})
        }
    }

    async fetchActivities() {
        const { user } = this.props;
        return await Axios.get(`${ApiConfig.dataApi}/coach/${user.user.ContactId}/all`, {
            params: {
                // Hardcoded value, change the "2019-08-21" for this.state.date for getting the result in a specific date
                date: this.state.date.format("YYYY-MM-DD")
            }
          })
          .then(res => res.data)
          .catch(e => console.log(e));
    }

    async selectDate(date) { 
        await this.setState({date: date})
        const activitiesList = await this.fetchActivities();
        console.log(activitiesList);
        this._syncReduxActivities(activitiesList);
    }

    selectActivity(teamSeasonId, sessionId) { this.props.navigation.navigate("Attendance", {teamSeasonId: teamSeasonId, sessionId: sessionId}) }

    toggleWelcomeModalOff() { 
        const { actions } = this.props;
        this.setState({welcomeModalVisibility: false})
        actions.updateFirstTimeLoggedIn();
    }
    SelectIndex(index){
        this.setState({selectedIndex: index});
        this.setState({displayedValue: this.state.regions[index.row]});
    }
    render() {
        const addIcon = (props) => ( <Icon {...props} name='person-add-outline'/> );
        let refreshing = false;
        const onRefresh = () => {
            refreshing = true;

            this._syncActivities().then(() => refreshing = false);

            // wait(2000).then(() => refreshing = false);
        };
        
        const CalendarIcon = (props) => ( <Icon {...props} name='calendar'/> );
        const renderItemIcon = (props) => (
            <View style={{flex: 1, flexDirection: 'row', justifyContent:'flex-end'}}>
                <Text  style={{alignSelf:"baseline"}}></Text>
                {/*<Icon {...props} name='people-outline'/> fill="#D62E0A"*/}
                <Icon {...props} name='calendar-outline'/> 
                <Icon {...props} name='arrow-ios-forward-outline'/> 
            </View>
        );
        const renderItemIconRed = (props) => (
            <View style={{flex: 1, flexDirection: 'row', justifyContent:'flex-end'}}>
                <Text  style={{alignSelf:"baseline"}}></Text>
                {/*<Icon {...props} name='people-outline'/> fill="#D62E0A"*/}
                <Icon {...props} fill="#D62E0A" name='calendar-outline'/> 
                <Icon {...props} fill="#D62E0A" name='arrow-ios-forward-outline'/> 
            </View>
        );
        const RenderItemImageNL = () => (
            <Image
              style={{ width: 45, height: 35,resizeMode: "contain"}}
              source={require('../assets/Unassigned_Session.png')}
            />
          );
        const RenderItemImageSW = () => (
            <Image
              style={{ width: 45, height: 45,resizeMode: "contain"}}
              source={require('../assets/Scores_Soccer_and_writing.png')}
            />
          );
        const RenderItemImageS = () => (
                <Image
                style={{ width: 45, height: 45, resizeMode: "contain"}}
                source={require('../assets/Scores_Ball.png')}
                />
            );
        const RenderItemImageW = () => (
                <Image
                style={{  width: 45, height: 45,resizeMode: "contain"}}
                source={require('../assets/Scores_Pencil_Edit.png')}
                />
        );
        const RenderItemImageGD = () => (
            <Image
            style={{  width: 45, height: 45,resizeMode: "contain"}}
            source={require('../assets/Scores_goal.png')}
            />
    );

        let activityItem = ({ item, index }) => {
            if (item.Sessions === null){
                return; 
            }
            else {
                //let sessionTopic = "Unasigned"
                //if (item.Sessions[0].SessionTopic) sessionTopic = item.Sessions[0].SessionTopic;
                return item.Sessions.map(value => {
                    if(value.SessionTopic === null){
                        if(String(this.props.sessionAttendance.sessionsAttendance).length !== 0){
                            if(this.props.sessionAttendance.sessionsAttendance[0][0] === undefined){
                                return <ListItem
                                    key={value.SessionId}
                                    title={`${item.Team_Name}`}
                                    style={{backgroundColor: "#C0E4F5"}}
                                    /*description={sessionTopic.replace(/_/g,' ')}*/
                                    accessoryLeft={RenderItemImageNL}
                                    accessoryRight={(String(this.props.sessionAttendance.sessionsAttendance).length !== 0)?
                                        ((value.SessionId !== this.props.sessionAttendance.sessionsAttendance[0].SessionId)?
                                        renderItemIcon
                                        :
                                        renderItemIconRed)
                                        :
                                        renderItemIcon}
                                    onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                />
                                      
                            }else{
                                let found=null;
                                this.props.sessionAttendance.sessionsAttendance[0].map((valueredux) =>{
                                    if(value.SessionId === valueredux.SessionId){
                                        found=true
                                    }
                                });
                                if(found === true){
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageNL}
                                        accessoryRight={renderItemIconRed}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                }else{
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageNL}
                                        accessoryRight={renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                }
                            }
                        }else{
                            return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageNL}
                                        accessoryRight={renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                        }
                    }else{
                        if(value.SessionTopic.replace(/_/g,' ') === "Soccer and Writing"){
                            if(String(this.props.sessionAttendance.sessionsAttendance).length !== 0){
                                if(this.props.sessionAttendance.sessionsAttendance[0][0] === undefined){
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageSW}
                                        accessoryRight={(String(this.props.sessionAttendance.sessionsAttendance).length !== 0)?
                                            ((value.SessionId !== this.props.sessionAttendance.sessionsAttendance[0].SessionId)?
                                            renderItemIcon
                                            :
                                            renderItemIconRed)
                                            :
                                            renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                          
                                }else{
                                    let found=null;
                                    this.props.sessionAttendance.sessionsAttendance[0].map((valueredux) =>{
                                        if(value.SessionId === valueredux.SessionId){
                                            found=true
                                        }
                                    });
                                    if(found === true){
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageSW}
                                            accessoryRight={renderItemIconRed}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }else{
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageSW}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }
                                }
                            }else{
                                return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageSW}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                            }
                        }else if(value.SessionTopic.replace(/_/g,' ') === "Soccer"){
                            if(String(this.props.sessionAttendance.sessionsAttendance).length !== 0){
                                if(this.props.sessionAttendance.sessionsAttendance[0][0] === undefined){
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageS}
                                        accessoryRight={(String(this.props.sessionAttendance.sessionsAttendance).length !== 0)?
                                            ((value.SessionId !== this.props.sessionAttendance.sessionsAttendance[0].SessionId)?
                                            renderItemIcon
                                            :
                                            renderItemIconRed)
                                            :
                                            renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                          
                                }else{
                                    let found=null;
                                    this.props.sessionAttendance.sessionsAttendance[0].map((valueredux) =>{
                                        if(value.SessionId === valueredux.SessionId){
                                            found=true
                                        }
                                    });
                                    if(found === true){
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageS}
                                            accessoryRight={renderItemIconRed}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }else{
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageS}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }
                                }
                            }else{
                                return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageS}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                            }
                        }else if(value.SessionTopic.replace(/_/g,' ') === "Writing"){
                            if(String(this.props.sessionAttendance.sessionsAttendance).length !== 0){
                                if(this.props.sessionAttendance.sessionsAttendance[0][0] === undefined){
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageW}
                                        accessoryRight={(String(this.props.sessionAttendance.sessionsAttendance).length !== 0)?
                                            ((value.SessionId !== this.props.sessionAttendance.sessionsAttendance[0].SessionId)?
                                            renderItemIcon
                                            :
                                            renderItemIconRed)
                                            :
                                            renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                        
                                }else{
                                    let found=null;
                                    this.props.sessionAttendance.sessionsAttendance[0].map((valueredux) =>{
                                        if(value.SessionId === valueredux.SessionId){
                                            found=true
                                        }
                                    });
                                    if(found === true){
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageW}
                                            accessoryRight={renderItemIconRed}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }else{
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageW}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }
                                }
                            }else{
                                return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageW}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                            }
                        }
                        else if(value.SessionTopic.replace(/_/g,' ') === "Game Day"){
                            if(String(this.props.sessionAttendance.sessionsAttendance).length !== 0){
                                if(this.props.sessionAttendance.sessionsAttendance[0][0] === undefined){
                                    return <ListItem
                                        key={value.SessionId}
                                        title={`${item.Team_Name}`}
                                        style={{backgroundColor: "#C0E4F5"}}
                                        /*description={sessionTopic.replace(/_/g,' ')}*/
                                        accessoryLeft={RenderItemImageGD}
                                        accessoryRight={(String(this.props.sessionAttendance.sessionsAttendance).length !== 0)?
                                            ((value.SessionId !== this.props.sessionAttendance.sessionsAttendance[0].SessionId)?
                                            renderItemIcon
                                            :
                                            renderItemIconRed)
                                            :
                                            renderItemIcon}
                                        onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                    />
                                        
                                }else{
                                    let found=null;
                                    this.props.sessionAttendance.sessionsAttendance[0].map((valueredux) =>{
                                        if(value.SessionId === valueredux.SessionId){
                                            found=true
                                        }
                                    });
                                    if(found === true){
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageGD}
                                            accessoryRight={renderItemIconRed}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }else{
                                        return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageGD}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                                    }
                                }
                            }else{
                                return <ListItem
                                            key={value.SessionId}
                                            title={`${item.Team_Name}`}
                                            style={{backgroundColor: "#C0E4F5"}}
                                            /*description={sessionTopic.replace(/_/g,' ')}*/
                                            accessoryLeft={RenderItemImageGD}
                                            accessoryRight={renderItemIcon}
                                            onPress={() => this.selectActivity(item.TeamSeasonId, value.SessionId)}
                                        />
                            }
                        }
                    }
                })
            }
        }
        const dateService = new MomentDateService();
        // var date = moment();

        // const minDatePickerDate = moment("20190101", "YYYYMMDD").toDate();

        const searchBox = () => (
            <Datepicker
                placeholder='Pick Date'
                date={this.state.date}
                size='large'
                // min={minDatePickerDate}
                style={{margin: "2%"}}
                dateService={dateService}
                onSelect={nextDate => this.selectDate(nextDate)}
                accessoryRight={CalendarIcon}
            />
        );

        /*const selectBox = () => (
            <Select
                label="Select a Region"
                placeholder={this.state.regions[0]}
                selectedIndex={this.state.selectedIndex}
                style={{marginBottom:"2%", marginTop:"1%", marginLeft:"2%", marginRight:"2%"}}
                value={this.state.displayedValue}
                onSelect={index => this.SelectIndex(index)}>
                {this.state.regions.map((title,i) =>
                    <SelectItem key={title} title={title}/>
                )}
          </Select>
        );*/


        const helloMessage = (status) => (
            (
                (this.state.welcomeModalVisibility) &&
                    <Card style={{opacity: 0.9}}>
                        <Text category="s1" status={status} style={{alignSelf: 'center'}}>
                            {this.props.user.user.FirstName} {this.props.user.user.LastName}
                        </Text>
                    </Card>
            )
        );
        const noMatch = (status) => (
            (
                (this.state.nomatchModalVisibility) &&
                <Card style={{opacity: 0.9, backgroundColor:"#C0E4F5"}}>
                    <Text category="s1" status={status} style={{alignSelf: 'center', backgroundColor:"#C0E4F5"}}>
                        There are no active Sessions for the selected date.
                    </Text>
                </Card>
            )
        );

        const addButton = () => {
            if (this.state.isUpdated){
                 return <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <ButtonGroup>
                <Button style={{width:"46%"}} status="primary" onPress={() => this.props.navigation.navigate("AddSessionModal", {teamSeasonId: this.state.teamSeasonId})}>+ ADD SESSION</Button>
                {/* <Button style={{width:"54%"}} accessoryLeft={addIcon} status="primary" onPress={() => this.props.navigation.navigate("AddStudentToTeamModal", {teamSeasonId: this.state.teamSeasonId})}>ENROLL STUDENT</Button>           */}
                </ButtonGroup>
                </View>
                }
        };

        return(
            /*<View source={require('../assets/ASBA_Logo.png')} style={{flex: 1}}>*/
                <Layout style={{ flex: 1, justifyContent: 'center'}}>
                {searchBox()}
                <Divider/>
                {helloMessage("info")}
                {/*{selectBox()}*/}
                {noMatch("basic")}
                    <ImageBackground source={require('../assets/ASBA_Logo.png')} style={styles.image}>
                        <List
                            style={{opacity: 0.95}}
                            data={this.state.activities}
                            renderItem={activityItem}
                            Divider={Divider}
                            refreshControl={
                                <RefreshControl
                                  refreshing={refreshing}
                                  onRefresh={onRefresh}
                                />
                              }
                        />
                        
                    </ImageBackground>
                    {addButton()}
                </Layout>      
           /* </View>     */                 
        );
    };
};

const mapStateToProps = state => ({ sessions: state.sessions, user: state.user , sessionScreen: state.sessionScreen , sessionAttendance: state.sessionAttendance });
  
const ActionCreators = Object.assign( {}, { syncSessions, updateFirstTimeLoggedIn, changeTitle } );
  
const mapDispatchToProps = dispatch => ({ actions: bindActionCreators(ActionCreators, dispatch) });

export default connect(mapStateToProps, mapDispatchToProps)(ActivitiesScreen);

const styles = StyleSheet.create({
    popOverContent: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf:'center',
        shadowRadius: 10,
        shadowOpacity: 0.12,
        shadowColor: "#000"
    },
    image: {
        flex:1, 
        resizeMode: 'contain',
        opacity: 0.99
    },
});