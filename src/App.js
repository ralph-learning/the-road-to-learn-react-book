import React, { Component } from 'react';
import './App.css';

const largeColumn = { width: '40%' };
const midColumn = { width: '30%' };
const smallColumn = { width: '10%' };

const DEFAULT_QUERY = 'redux';
const DEFAULT_HITS_PER_PAGE = '10';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const HITS_PER_PAGE = 'hitsPerPage=';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: DEFAULT_QUERY,
      results: null,
      searchKey: '',
    };

    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
  }

  componentWillMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.setSearchTopStories(this.searchTerm);
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);

    event.preventDefault();
  }

  onDismiss(id) {
    const isNotId = item => item.objectID !== id;
    const updatedList = this.state.result.hits.filter(isNotId);
    this.setState({
      result: {
        ...this.state.result,
        hits: updatedList,
      }
    });
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  setSearchTopStories(result) {
    const { hits, page } = result;
    const { searchKey, results } = this.state;

    const oldHits = results && results[searchKey]
      ? result[searchKey].hits
      : [];

    const updateHits = [
      ...oldHits,
      ...hits,
    ];

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updateHits, page },
      },
    });
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${HITS_PER_PAGE}${DEFAULT_HITS_PER_PAGE}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => e);
  }

  componentDidMount() {
    const  { searchTerm } = this.state;
    this.fetchSearchTopStories(searchTerm);
  }

  render() {
    const { searchTerm, result } = this.state;
    if (!result) { return null }
    const page = (result && result.page) || 0;

    return (
      <div className="page">
        <div className="interactions">
          <Search
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
            type="text"
            value={searchTerm}
          >Search</Search>
        </div>
        {
          result &&
            <Table
              list={result.hits}
              onDismiss={this.onDismiss}
            />
        }

        <div className="interactions">
          <button onClick={() => this.fetchSearchTopStories(searchTerm, page + 1)}>
            More
          </button>
        </div>
      </div>
    );
  }
}

const Search = ({ value, onChange, onSubmit, children }) => (
  <form onSubmit={onSubmit}>
    <input
      type="text"
      value={value}
      onChange={onChange}
    />
    <button type="submit">
      {children}
    </button>
  </form>
);

const Table = ({ list, pattern, onDismiss }) => (
  <div className="table">
    {list.map(item =>
      <div key={item.objectID}  className="table-row">
        <span className={largeColumn}>
          <a href={item.url}>{item.title}</a>
        </span>
        <span className={midColumn}>
          {item.author}
        </span>
        <span className={smallColumn}>
          {item.num_comments}
        </span>
        <span className={smallColumn}>
          {item.points}
        </span>
        <span className={smallColumn}>
          <Button onClick={() => onDismiss(item.objectID)}>
            Dismiss
          </Button>
        </span>
    </div> )}
  </div>
);

const Button = ({onClick, className = '', children}) => (
  <button
    onClick={onClick}
    className={className}
    type="button"
  > { children }
  </button>
);



export default App;