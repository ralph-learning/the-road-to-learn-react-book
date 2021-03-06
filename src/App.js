import React, { Component } from 'react';
import fetch from 'isomorphic-fetch';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import classNames from 'classnames';

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

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};


const updateSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;

  const oldHits = (results && results[searchKey])
    ? results[searchKey].hits
    : [];

  const updateHits = [
    ...oldHits,
    ...hits,
  ];

  return {
    results: {
      ...results,
      [searchKey]: { hits: updateHits, page }
    },
    isLoading: false,
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: DEFAULT_QUERY,
      results: [],
      searchKey: '',
      error: null,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
  }

  componentWillMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(this.searchTerm);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }

    event.preventDefault();
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page },
      }
    });
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  setSearchTopStories(result) {
    const { hits, page } = result;
    this.setState(updateSearchTopStoriesState(hits, page));
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true })
    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${HITS_PER_PAGE}${DEFAULT_HITS_PER_PAGE}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => this.setState({ error: e }));
  }

  componentDidMount() {
    const  { searchTerm } = this.state;
    this.fetchSearchTopStories(searchTerm);
  }

  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error,
      isLoading,
    } = this.state;
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

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

        { error
          ? <div className="interactions">
            <p>Something went wrong.</p>
          </div>
          : <Table
            list={list}
            onDismiss={this.onDismiss}
          /> }

        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
          >
            More
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}

const withLoading = (Component) => ({ isLoading, ...rest }) => {
  return (
    isLoading
      ? <Loading />
      : <Component {...rest} />
  );
}

class Search extends Component {
  componentDidMount() {
    // this.input.focus();
  }

  render() {
    const { value, onChange, onSubmit, children } = this.props;
    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={(node) => this.input = node}
        />
        <button type="submit">
          {children}
        </button>
      </form>
    );
  }
}

Search.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: 'NONE',
      isSortReverse: false,
    };

    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const { list, onDismiss } = this.props;
    const { isSortReverse, sortKey } = this.state;
    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = this.state.isSortReverse
      ? sortedList.reverse()
      : sortedList;

    const iconSort = () =>  {
      return classNames(
        'fa',
        { 'fa-arrow-up': isSortReverse === false },
        { 'fa-arrow-down': isSortReverse === true },
      );
    }

    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: '40%' }}>
            <Sort
              sortKey={'TITLE'}
              activeSortKey={sortKey}
              onSort={this.onSort}
            > Title <i className={iconSort()}></i>
            </Sort>
          </span>
          <span style={{ width: '30%' }}>
            <Sort
              sortKey={'AUTHOR'}
              activeSortKey={sortKey}
              onSort={this.onSort}
            > Author <i className={iconSort()}></i>
              </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'COMMENTS'}
              activeSortKey={sortKey}
              onSort={this.onSort}
            >
              Comments <i className={iconSort()}></i>
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'POINTS'}
              activeSortKey={sortKey}
              onSort={this.onSort}
            > Points <i className={iconSort()}></i>
            </Sort>
          </span>
          <span style={{ width: '10%' }}>
            Archive
          </span>
        </div>

        {reverseSortedList.map(item =>
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
  }
}

const Sort = ({
  sortKey,
  activeSortKey,
  onSort,
  children,
}) => {
  const sortClass =  classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  );

  return (
    <Button onClick={() => onSort(sortKey)} className={sortClass}>
      {children}
    </Button>
  );
};

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
}

const Button = ({onClick, className, children}) => (
  <button
    onClick={onClick}
    className={className}
    type="button"
  > { children }
  </button>
);

const ButtonWithLoading = withLoading(Button)

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}
Button.defaultProps = {
  className: '',
}

const Loading = () =>
  <div>Loading...</div>

export default App;
export {
  Button,
  Search,
Table, };
